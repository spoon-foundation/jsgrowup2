import { Decimal } from "decimal.js"

export const MALE = "male"
export const FEMALE = "female"

export enum SexSpecification {
  Male = MALE,
  Female = FEMALE,
}

interface AgeSpecification {
  ageInDays?: number,
  ageInMonths?: number,
  dob?: Date,
  dateOfObservation?: Date,
}

const WEIGHT_BASED_INDICATORS = [
  "wfa",
  "wfl",
  "wfh",
  "bmifa",
]


// This helper function replaces earlier approaches that used much more
// succinct string interpolation for the filenames in these dynamic
// imports–rollup wasn't properly including the json files in bundles.
async function getJsonData(type: string, tableName: string) {
  if (type == "day") {
    switch (tableName) {
      case "acfa":
        return await import("./by_day_acfa.json")
      case "bmifa":
        return await import("./by_day_bmifa.json")
      case "hcfa":
        return await import("./by_day_hcfa.json")
      case "lfa":
        return await import("./by_day_lfa.json")
      case "wfa":
        return await import("./by_day_wfa.json")
      case "wfh":
        return await import("./by_day_wfh.json")
      case "wfl":
        return await import("./by_day_wfl.json")
      default:
        throw new Error(`Unexpected type (${type}) and/or tableName (${tableName})`)
    }
  }
  else {
    switch (tableName) {
      case "bmifa":
        return await import("./by_month_bmifa.json")
      case "lfa":
        return await import("./by_month_lfa.json")
      case "wfa":
        return await import("./by_month_wfa.json")
      default:
        throw new Error(`Unexpected type (${type}) and/or tableName (${tableName})`)
    }
  }
}


/*
 * Observation of a growth measurement for a single child on a single day.
 * @constructor
 * @param: {string} sex: either "male" or "female"
 * @param: {Object} ageSpecification - specify the child's age on the day of the observation in one of three ways.
 * @param: {number} ageSpecification.ageInDays - age in days
 * @param: {number} ageSpecification.ageInMonths - age in months–can be a real number for greater precision.
 * @param: {Date} ageSpecification.dob - child's date of birth. Requires dateOfObservation as well.
 * @param: {Date} ageSpecification.dateOfObservation - date of the observation. Requires dob as well.
 * 
 */
export class Observation {
  t: Decimal  // age in days!
  sex: SexSpecification

  // Constructor sets sex and "t": age in days at time of observation
  constructor(sex: SexSpecification, age: AgeSpecification) {
    if (![MALE, FEMALE].includes(sex)) {
      throw new Error(`Sex must be either ${MALE} or ${FEMALE}`)
    }
    this.sex = sex
    if (age.ageInDays !== undefined && Number.isFinite(age.ageInDays)) {
      this.t = new Decimal(age.ageInDays)
      return
    }
    if (age.ageInMonths !== undefined && Number.isFinite(age.ageInMonths)) {
      const daysPerMonth = 365.25 / 12
      this.t = new Decimal(age.ageInMonths * daysPerMonth).floor()
      return
    }
    if (age.dob && age.dateOfObservation) {
      // Using valueOf() to appease Typescript (https://stackoverflow.com/a/60688789/697143)
      this.t = new Decimal((age.dateOfObservation.valueOf() - age.dob.valueOf()) / (1000 * 60 * 60 * 24)).round()
      return
    }
    throw new Error(
      "'age' parameter must provide one of the following properties: " +
      "ageInDays, ageInMonths, or dob AND dateOfObservation"
    )
  }

  // Look up & return the l, m, s values for a given growth standard, sex, and t value.
  // tableName: one of our abbreviated names for the growth standards
  // y: the measurement in question (float or Decimal)
  // t: length/height measurement in cm–only if calculating weight-for-length/height,
  protected async getBoxCoxVariables(tableName: string, length?: Decimal) {
    // We have by-day data for all age-related metrics up to 5 years of age.
    // The two by-weight metrics' data are housed in the same place--their t values will be floats.
    let t: Decimal
    let tableIndex: number
    let isAgeBased = true
    let tableType: string
    if (length == undefined) {
      t = new Decimal(this.t)
      tableIndex = t.floor().toNumber()
    } else {
      t = length
      tableIndex = parseFloat(t.toFixed(2))
      isAgeBased = false
    }
    if (!isAgeBased || t.lte(1856)) {
      tableType = "day"
    } else {
      // Must be an age-based metric for an age over 5 years. Round age (in days) to nearest month.
      tableIndex = t.dividedBy(365 / 12).floor().toNumber()
      tableType = "month"
    }
    const data: { [index: string]: any } = await getJsonData(tableType, tableName)
    const result = data[this.sex][tableIndex]
    if (!result) {
      throw new Error(`t value out of range or not found (${t.toNumber()})`)
    }
    const lms = ["l", "m", "s"]
    lms.forEach(char => result[char] = new Decimal(result[char]))
    return result
  }

  /*
  *    Calculate and return a "first-pass" z-score given the key inputs
  *    derived from a child's age (or in some cases, length/height).
  *
  *    ("First-pass" in this case refers to the fact that certain weight-based
  *    metrics require further refinement when -3 < z < 3.)
  *
  *    The naming of the variables corresponds with the nomenclature in
  *    "WHO Child Growth Standards: Methods and development". See Chapter 7:
  *    "Computation of centiles and z-scores"
  *    http://www.who.int/entity/childgrowth/standards/technical_report/en/
  *
  *    The age (or length/height for wfl/wfh) referenced above is called "t",
  *    and is not dealt with directly in this method, but it is referenced
  *    below in the args.
  *
  *    Args:
  *        y: the measurement in question (number)
  *        l: aka L(t); Box-Cox power for t (number)
  *        m: aka M(t); median for t (number)
  *        s: aka S(t); coefficient of variation for t (number)
  *
  *    The returned value of this method is computed based on the formula
  *    found in that chapter. It will be a Decimal.
  */
  protected getFirstPassZScore(y: Decimal, l: Decimal, m: Decimal, s: Decimal) {
    // Formula from Chapter 7:
    //
    //           [y/M(t)]^L(t) - 1
    //   Zind =  -----------------
    //               S(t)L(t)
    const base = y.dividedBy(m)
    const power = base.toPower(l)
    const numerator = power.minus(1)
    const denominator = s.times(l)
    const zScore = numerator.dividedBy(denominator)
    return zScore
  }

  /* Adjust first-pass z_score and return new value.

  To be used in cases where first-pass value is > 3 or < -3.

  See Chapter 7 of "Computation of centiles and z-scores" referenced above for the formulae.
  */
  protected adjustWeightBasedZScore(zScore: Decimal, y: Decimal, l: Decimal, m: Decimal, s: Decimal) {
    const one = new Decimal(1)
    const exp = one.dividedBy(l)
    if (zScore.greaterThan(3)) {
      // Formula:
      //             y - SD3pos
      // z*ind = 3 + ----------
      //              SD23pos
      // Where:
      // SD3pos = M(t)[1 + L(t)*S(t)*(3)]^1/L(t) and
      // SD23pos = M(t)[1 + L(t)*S(t)*(3)]^1/L(t) -
      //           M(t)[1 + L(t)*S(t)*(2)]^1/L(t)
      const SD3posBase = one.plus(l.times(s).times(3))
      const SD3pos = m.times(SD3posBase.toPower(exp))
      const SD23pos_1 = one.plus(l.times(s).times(3))
      const SD23pos_2 = one.plus(l.times(s).times(new Decimal(2)))
      const SD23pos = m.times(SD23pos_1.toPower(exp)).minus(m.times(SD23pos_2.toPower(exp)))
      zScore = y.minus(SD3pos).dividedBy(SD23pos).plus(3)
    } else if (zScore.lessThan(-3)) {
      // Formula:
      //              y - SD3neg
      // z*ind = -3 + ----------
      //               SD23neg
      const SD3neg_base = one.plus(l.times(s).times(-3))
      const SD3neg = m.times(SD3neg_base.toPower(exp))
      const SD23neg_1 = one.plus(l.times(s).times(new Decimal(-2)))
      const SD23neg_2 = one.plus(l.times(s).times(-3))
      const SD23neg = m.times(SD23neg_1.toPower(exp)).minus(m.times(SD23neg_2.toPower(exp)))
      zScore = y.minus(SD3neg).dividedBy(SD23neg).plus(-3)
    }
    return zScore
  }

  /* Validate that the value t (self.t; in days, unless overridden) is
  within the range for a particular growth metric. Both boundaries are
  inclusive.

  @param: {Object} args
  @param: {number} args.t: length or height value, when the metric is not "for-age". opt.
  @param: {number} args.lower: minimum number of days supported for a metric.
  @param: {number} args.upper: maximum number of days supported for a metric.
  @param: {number} args.msg: description of range.

  Raises:
      MissingAgeError: if t is not supplied.
      AgeOutOfRangeError: if t is out of range
  Returns:
      null
  */
  protected validateT(args: { t?: Decimal, lower?: number, upper?: number, msg?: string }) {
    let { t, msg } = args
    const { lower, upper } = args
    msg = msg ? msg : `Range is ${lower} to ${upper}`
    t = t ? t : this.t
    if (!t && t != new Decimal(0)) {
      msg = `No time data supplied. ${msg}`
      throw new Error(msg)
    }
    msg = `"t" value ${t} outside of range. ${msg}`
    if (lower && t.lessThan(lower)) {
      throw new Error(msg)
    }
    if (upper && t.greaterThan(upper)) {
      throw new Error(msg)
    }
  }

  /* Validate that the measurement value is within the range for a
  particular growth metric. Both boundaries are inclusive. The range
  should be very, very generous!

  * @param: {number} y – the measurement in question.
  * @param: {number} lower – minimum number of days supported for a metric.
  * @param: {number} upper – maximum number of days supported for a metric.
  * @param: {string} msg – description of the range (optional)

  Throws errors if:
      measurement is outside the range.
      if measurement is not numeric.
  @returns {Decimal} measurement value
  */
  protected validateMeasurement(measurement: number, lower: number, upper: number, msg?: string) {
    let y: Decimal
    if (!msg) {
      msg = `Range is ${lower} to ${upper}`
    }
    if (!measurement) {
      throw new Error(`No measurement supplied. ${msg}`)
    }

    try {
      y = new Decimal(measurement)
    } catch {
      throw new Error("Measurement must be numeric.")
    }

    msg = `Measurement value ${measurement} outside of range. ${msg}`
    if (lower && y.lt(lower)) {
      throw new Error(msg)
    }
    if (upper && y.gt(upper)) {
      throw new Error(msg)
    }
    return y
  }

  /* Calculate and return a z-score.
  *
  * @param: {string} table_name: one of our abbreviated names for the growth standards.
  * @param: {Decimal} y: the measurement in question (Decimal)
  * @param: {number} t: age in days (whole number) or, for weight-for-length/height, length/height measurement in cm
  *
  * @returns {string} z score as a string with rounded to two decimals
  * Throws an error for exceptional values of y or t.
  */
  protected async getZScore(table_name: string, y: Decimal, t?: Decimal): Promise<string> {
    const { l, m, s } = await this.getBoxCoxVariables(table_name, t)
    let zScore = this.getFirstPassZScore(y, l, m, s)
    if (WEIGHT_BASED_INDICATORS.includes(table_name) && zScore.abs().greaterThan(3)) {
      zScore = this.adjustWeightBasedZScore(zScore, y, l, m, s)
    }
    return zScore.toFixed(2)
  }

  /*
   * Return the arm circumference-for-age z-score (aka MUAC).
   * 
   * The valid age range is 3 months to 5 years.
   * @param: {number} measurement: mid-upper arm circumference measurement (in cm)
   * @returns {Promise} resolving to a string representing the z score rounded to two decimals.
   */
  async armCircumferenceForAge(measurement: number) {
    this.validateT({
      lower: 91, upper: 1856,
      msg: "Range is 3 months to 5 years."
    })
    const y = this.validateMeasurement(measurement, 3, 40)
    return await this.getZScore("acfa", y)
  }

  /*
   * Return the BMI (body mass index)-for-age z-score.
   * 
   * The valid age range is birth to 19 years.
   * @param: {number} measurement: BMI value as a number
   * @returns {Promise} resolving to a string representing the z score rounded to two decimals.
   */
  async bmiForAge(measurement: number) {
    this.validateT({ lower: 0, upper: 19 * 365, msg: "Range is birth to 19 years." })
    const y = this.validateMeasurement(measurement, 5, 60)
    return await this.getZScore("bmifa", y)
  }

  /*
   * Return the head circumference-for-age z-score.
   * 
   * The valid age range is birth to 5 years.
   * @param: {number} head circumference measurement (in cm)
   * @returns {Promise} resolving to a string representing the z score rounded to two decimals.
   */
  async headCircumferenceForAge(measurement: number) {
    this.validateT({ lower: 0, upper: 1856, msg: "Range is birth to 5 years." })
    const y = this.validateMeasurement(measurement, 10, 150)
    return await this.getZScore("hcfa", y)
  }

  /*
   * Return the length/height-for-age z-score.
   * 
   * The valid age range is birth to 19 years.
   * @param: {number} length or height measurement (in cm)
   * @param: {boolean} recumbent – was the measurement taken with child lying down? Ignored
      for children under 2 years. Defaults to false.
   * @returns {Promise} resolving to a string representing the z score rounded to two decimals.
   */
  async lengthOrHeightForAge(measurement: number, recumbent: boolean = false) {
    this.validateT({ lower: 0, upper: 19 * 365, msg: "Range is birth to 19 years." })
    let y = this.validateMeasurement(measurement, 10, 200)
    if (this.t.gte(365 * 2) && recumbent) {
      y = y.minus(0.7)
    }

    return await this.getZScore("lfa", y)
  }

  /*
   *Return the weight-for-age z-score.
   * 
   * The valid age range is birth to 10 years.
   * @param: {number} weight measurement (in kg)
   * @returns {Promise} resolving to a string representing the z score rounded to two decimals.
   */
  async weightForAge(measurement: number) {
    this.validateT({ lower: 0, upper: 10 * 365, msg: "Range is birth to 10 years." })
    const y = this.validateMeasurement(measurement, 1, 125)
    return await this.getZScore("wfa", y)
  }

  /*
   *Return the weight-for-height z-score.
   * 
   * The valid age range is 2 to 5 years (though not enforced).
   * @param: {number} weight measurement (in kg)
   * @param: {number} height measurement (in cm)
   * @returns {Promise} resolving to a string representing the z score rounded to two decimals.
   */
  async weightForHeight(weight: number, height: number) {
    // We want t to be a number with 0.1 precision.
    const t = new Decimal(new Decimal(height).toFixed(2))
    this.validateT({ t: t, lower: 65, upper: 120, msg: "Height range is 65cm to 120 cm." })
    const y = this.validateMeasurement(weight, 1, 125)
    return await this.getZScore("wfh", y, t)
  }

  /*
   *Return the weight-for-length z-score.
   * 
   * The valid age range is birth to 2 years (though not enforced).
   * @param: {number} weight measurement (in kg)
   * @param: {number} length measurement (in cm)
   * @returns {Promise} resolving to a string representing the z score rounded to two decimals.
   */
  async weightForLength(weight: number, length: number) {
    // We want t to be a number with 0.1 precision.
    const t = new Decimal(new Decimal(length).toFixed(2))
    this.validateT({ t: t, lower: 45, upper: 110, msg: "Height range is 45cm to 110 cm." })
    const y = this.validateMeasurement(weight, 1, 125)
    return await this.getZScore("wfl", y, t)
  }

}
