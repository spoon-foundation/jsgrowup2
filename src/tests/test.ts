import {describe, expect, test} from '@jest/globals';
import { Decimal } from "decimal.js"

import { Observation } from "../index"

// This file is derived from the R implementation of iGrowup. We're trusting
// its z score values. It's a CSV with erratically named columns, so we
// normalize the names for ease of use.
import { DATA as WHO_DATA } from "./data_who"
// This file is derived from a sample set of data from SPOON, run through the
// stata implementation of iGrowup. We're trusting its z score values as well.
// And it's also a CSV with erratically named columns, so we again normalize
// names for ease of use.
import { DATA as SPOON_DATA } from "./data_spoon"

// How close do we want our results to match other's?
const DELTA = 0.1

let filteredData: Array<object>

// Return a function that can be passed to Array.filter to winnow down our dataset
// to be appropriate for a given test.
function getDataFilter(zFieldName: string, measurementName: string, ageInMonthsMin: number, ageInMonthsMax: number) {
  return function (row: any) {
    if (row[zFieldName] == "") {
      return false
    }
    if (!row[measurementName]) {
      return false
    }
    if (row["ageInMonths"] < ageInMonthsMin || row["ageInMonths"] > ageInMonthsMax) {
      return false
    }
    return true
  }
}


describe("Arm Circumference for Age", () => {

  async function testArmCircumferenceForAge(row: any) {
    const y = row.armCircumference
    const expectedZScore = row.acfaZ

    const obsFromAgeMonths = new Observation(row.sex, { ageInMonths: row.ageInMonths })
    let receivedZScore = await obsFromAgeMonths.armCircumferenceForAge(y)
    let delta = Math.abs(parseFloat(receivedZScore) - expectedZScore)
    expect(delta).toBeLessThanOrEqual(DELTA)

    const obsFromAgeDays = new Observation(row.sex, { ageInDays: row.ageInDays })
    receivedZScore = await obsFromAgeDays.armCircumferenceForAge(y)
    delta = Math.abs(parseFloat(receivedZScore) - expectedZScore)
    expect(delta).toBeLessThanOrEqual(DELTA)
  }

  const dataFilter = getDataFilter("acfaZ", "armCircumference", 3, 12 * 19)
  filteredData = WHO_DATA.filter(dataFilter)
  test.each(filteredData)('acfa, WHO data, row $id', testArmCircumferenceForAge)
})

describe("BMI for Age", () => {

  async function testBmiForAge(row: any) {
    const y = row.bmi
    const expectedZScore = row.bmifaZ

    const obsFromAgeMonths = new Observation(row.sex, { ageInMonths: row.ageInMonths })
    let receivedZScore = await obsFromAgeMonths.bmiForAge(y)
    let delta = Math.abs(parseFloat(receivedZScore) - expectedZScore)
    expect(delta).toBeLessThanOrEqual(DELTA)

    const obsFromAgeDays = new Observation(row.sex, { ageInDays: row.ageInDays })
    receivedZScore = await obsFromAgeDays.bmiForAge(y)
    delta = Math.abs(parseFloat(receivedZScore) - expectedZScore)
    expect(delta).toBeLessThanOrEqual(DELTA)
  }

  const dataFilter = getDataFilter("bmifaZ", "bmi", 0, 12 * 19)
  filteredData = WHO_DATA.filter(dataFilter)
  test.each(filteredData)('bmifa, WHO data, row $id', testBmiForAge)

  async function testBmiForAge2(row: any) {
    const y = row.bmi
    const ageSpec = {
      dob: new Date(row.dob),
      dateOfObservation: new Date(row.dateOfObservation),
    }
    const observation = new Observation(row.sex, ageSpec)
    const receivedZScore = await observation.bmiForAge(y)
    const expectedZScore = row.bmifaZ == "" ? row.bmifaZ2 : row.bmifaZ
    const delta = Math.abs(parseFloat(receivedZScore) - expectedZScore)
    expect(delta).toBeLessThanOrEqual(DELTA)
  }

  filteredData = SPOON_DATA.filter(dataFilter)
  test.each(filteredData)('bmifa, SPOON data, row $id', testBmiForAge2)
})

describe("Head Circumference for Age", () => {

  async function testHeadCircumferenceForAge(row: any) {
    const y = row.headCircumference
    const expectedZScore = row.hcfaZ

    const obsFromAgeMonths = new Observation(row.sex, { ageInMonths: row.ageInMonths })
    let receivedZScore = await obsFromAgeMonths.headCircumferenceForAge(y)
    let delta = Math.abs(parseFloat(receivedZScore) - expectedZScore)
    expect(delta).toBeLessThanOrEqual(DELTA)

    const obsFromAgeDays = new Observation(row.sex, { ageInDays: row.ageInDays })
    receivedZScore = await obsFromAgeDays.headCircumferenceForAge(y)
    delta = Math.abs(parseFloat(receivedZScore) - expectedZScore)
    expect(delta).toBeLessThanOrEqual(DELTA)
  }

  const dataFilter = getDataFilter("hcfaZ", "headCircumference", 0, 12 * 5)
  filteredData = WHO_DATA.filter(dataFilter)
  test.each(filteredData)('hcfa, WHO data, row $id', testHeadCircumferenceForAge)

  async function testHeadCircumferenceForAge2(row: any) {
    const y = row.headCircumference
    const expectedZScore = row.hcfaZ

    const ageSpec = {
      dob: new Date(row.dob),
      dateOfObservation: new Date(row.dateOfObservation),
    }
    const observation = new Observation(row.sex, ageSpec)
    const receivedZScore = await observation.headCircumferenceForAge(y)
    const delta = Math.abs(parseFloat(receivedZScore) - expectedZScore)
    expect(delta).toBeLessThanOrEqual(DELTA)
  }

  filteredData = SPOON_DATA.filter(dataFilter)
  test.each(filteredData)('hcfa, SPOON data, row $id', testHeadCircumferenceForAge2)
})

describe("Weight for Age", () => {

  async function testWeightForAge(row: any) {
    const y = row.weight
    const expectedZScore = row.wfaZ

    const obsFromAgeMonths = new Observation(row.sex, { ageInMonths: row.ageInMonths })
    let receivedZScore = await obsFromAgeMonths.weightForAge(y)
    let delta = Math.abs(parseFloat(receivedZScore) - expectedZScore)
    expect(delta).toBeLessThanOrEqual(DELTA)

    const obsFromAgeDays = new Observation(row.sex, { ageInDays: row.ageInDays })
    receivedZScore = await obsFromAgeDays.weightForAge(y)
    delta = Math.abs(parseFloat(receivedZScore) - expectedZScore)
    expect(delta).toBeLessThanOrEqual(DELTA)
  }

  // Set the filter to be slightly less than 12 months * 10 years bc there's
  // a sample where the age in months is less than 120 but the age in days
  // exceeds the threshold.
  const dataFilter = getDataFilter("wfaZ", "weight", 0, 12 * 9.9)
  filteredData = WHO_DATA.filter(dataFilter)
  test.each(filteredData)('wfa, WHO data, row $id', testWeightForAge)

  async function testWeightForAge2(row: any) {
    const y = row.weight
    const expectedZScore = row.wfaZ

    const ageSpec = {
      dob: new Date(row.dob),
      dateOfObservation: new Date(row.dateOfObservation),
    }
    const observation = new Observation(row.sex, ageSpec)
    const receivedZScore = await observation.weightForAge(y)
    const delta = Math.abs(parseFloat(receivedZScore) - expectedZScore)
    expect(delta).toBeLessThanOrEqual(DELTA)
  }

  filteredData = SPOON_DATA.filter(dataFilter).filter(row => row.ageInMonths < 120)
  test.each(filteredData)('wfa, SPOON data, row $id', testWeightForAge2)
})

describe("Length/height for Age", () => {

  async function testLengthOrHeightForAge(row: any) {
    const y = row.height
    const expectedZScore = row.lfaZ

    const obsFromAgeMonths = new Observation(row.sex, { ageInMonths: row.ageInMonths })
    let receivedZScore = await obsFromAgeMonths.lengthOrHeightForAge(y, row.lOrH == "l")
    let delta = Math.abs(parseFloat(receivedZScore) - expectedZScore)
    expect(delta).toBeLessThanOrEqual(DELTA)

    const obsFromAgeDays = new Observation(row.sex, { ageInDays: row.ageInDays })
    receivedZScore = await obsFromAgeDays.lengthOrHeightForAge(y, row.lOrH == "l")
    delta = Math.abs(parseFloat(receivedZScore) - expectedZScore)
    expect(delta).toBeLessThanOrEqual(DELTA)

  }

  const dataFilter = getDataFilter("lfaZ", "height", 0, 12 * 19)
  filteredData = WHO_DATA.filter(dataFilter)
  test.each(filteredData)('lfa, WHO data, row $id', testLengthOrHeightForAge)

  async function testLengthOrHeightForAge2(row: any) {
    const y = row.height
    const expectedZScore = row.lfaZ != "" ? row.lfaZ : row.lfaZ2

    const ageSpec = {
      dob: new Date(row.dob),
      dateOfObservation: new Date(row.dateOfObservation),
    }
    const observation = new Observation(row.sex, ageSpec)
    const receivedZScore = await observation.lengthOrHeightForAge(y, row.lOrH == "l")
    const delta = new Decimal(receivedZScore)
      .minus(expectedZScore)
      .absoluteValue()
      .times(10)
      .floor()
    // So now delta is an integer that we want to be less than 1.
    // (That is, representing a difference of less than 0.1)
    expect(delta.lte(1)).toBeTruthy()
  }

  function dataFilter2 (row: any) {
    if (row["lfaZ"] == "" && row["lfaZ2"] == "") {
      return false
    }
    return true
  }


  filteredData = SPOON_DATA.filter(dataFilter2)
  test.each(filteredData)('lfa, SPOON data, row $id', testLengthOrHeightForAge2)
})

describe("Weight for Height", () => {

  async function testWeightForHeight(row: any) {
    const weight = row.weight
    const height = row.height
    const expectedZScore = row.wflZ

    const obsFromAgeMonths = new Observation(row.sex, { ageInMonths: row.ageInMonths })
    let receivedZScore = await obsFromAgeMonths.weightForHeight(weight, height)
    let delta = Math.abs(parseFloat(receivedZScore) - expectedZScore)
    expect(delta).toBeLessThanOrEqual(DELTA)

    const obsFromAgeDays = new Observation(row.sex, { ageInDays: row.ageInDays })
    receivedZScore = await obsFromAgeDays.weightForHeight(weight, height)
    delta = Math.abs(parseFloat(receivedZScore) - expectedZScore)
    expect(delta).toBeLessThanOrEqual(DELTA)
  }

  async function testWeightForHeight2(row: any) {
    const weight = row.weight
    const height = row.height
    const expectedZScore = row.wflZ

    const ageSpec = {
      dob: new Date(row.dob),
      dateOfObservation: new Date(row.dateOfObservation),
    }
    const observation = new Observation(row.sex, ageSpec)
    const receivedZScore = await observation.weightForHeight(weight, height)
    const delta = Math.abs(parseFloat(receivedZScore) - expectedZScore)
    expect(delta).toBeLessThanOrEqual(DELTA)
  }

  function dataFilter (row: any) {
    if (row["wflZ"] == "") {
      return false
    }
    if (row.lOrH != "h") {
      return false
    }
    return true
  }

  function dataFilter2 (row: any) {
    // Filter SPOON data differently; there's no recumbent flag, so make
    // sure child is over 2.
    if (row["wflZ"] == "") {
      return false
    }
    if (!row.ageInMonths || row.ageInMonths < 24) {
      return false
    }
    return true
  }

  filteredData = WHO_DATA.filter(dataFilter)
  test.each(filteredData)('wfh, WHO data, row $id', testWeightForHeight)

  filteredData = SPOON_DATA.filter(dataFilter2)
  test.each(filteredData)('wfh, SPOON data, row $id', testWeightForHeight2)
})

describe("Weight for Length", () => {

  async function testWeightForLength(row: any) {
    const weight = row.weight
    const height = row.height
    const expectedZScore = row.wflZ

    const obsFromAgeMonths = new Observation(row.sex, { ageInMonths: row.ageInMonths })
    let receivedZScore = await obsFromAgeMonths.weightForLength(weight, height)
    let delta = Math.abs(parseFloat(receivedZScore) - expectedZScore)
    expect(delta).toBeLessThanOrEqual(DELTA)

    const obsFromAgeDays = new Observation(row.sex, { ageInDays: row.ageInDays })
    receivedZScore = await obsFromAgeDays.weightForLength(weight, height)
    delta = Math.abs(parseFloat(receivedZScore) - expectedZScore)
    expect(delta).toBeLessThanOrEqual(DELTA)
  }

  async function testWeightForLength2(row: any) {
    const weight = row.weight
    const height = row.height
    const expectedZScore = row.wflZ

    const ageSpec = {
      dob: new Date(row.dob),
      dateOfObservation: new Date(row.dateOfObservation),
    }
    const observation = new Observation(row.sex, ageSpec)
    const receivedZScore = await observation.weightForLength(weight, height)
    const delta = Math.abs(parseFloat(receivedZScore) - expectedZScore)
    expect(delta).toBeLessThanOrEqual(DELTA)
  }

  function dataFilter (row: any) {
    if (row["wflZ"] == "") {
      return false
    }
    if (row.lOrH != "l") {
      return false
    }
    if (row.height > 110) {
      return false
    }
    return true
  }

  function dataFilter2 (row: any) {
    if (row["wflZ"] == "") {
      return false
    }
    if (!row.ageInMonths || row.ageInMonths > 24) {
      return false
    }
    if (row.height > 110) {
      return false
    }
    return true
  }
  filteredData = WHO_DATA.filter(dataFilter)
  test.each(filteredData)('wfl, WHO data, row $id', testWeightForLength)

  filteredData = SPOON_DATA.filter(dataFilter2)
  test.each(filteredData)('wfl, SPOON data, row $id', testWeightForLength2)
})
