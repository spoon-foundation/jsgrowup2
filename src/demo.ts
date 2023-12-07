import { Observation, SexSpecification } from "./index.js"

// Import all of our json files explicitly so that treeshakers still include them.
// (They're imported dynamically in the actual logic.)
import by_day_acfa from "./by_day_acfa.json"
import by_day_bmifa from "./by_day_bmifa.json"
import by_day_hcfa from "./by_day_hcfa.json"
import by_day_lfa from "./by_day_lfa.json"
import by_day_wfa from "./by_day_wfa.json"
import by_day_wfh from "./by_day_wfh.json"
import by_day_wfl from "./by_day_wfl.json"
import by_month_bmifa from "./by_month_bmifa.json"
import by_month_lfa from "./by_month_lfa.json"
import by_month_wfa from "./by_month_wfa.json"

// Mollify linters
by_day_acfa
by_day_bmifa
by_day_hcfa
by_day_lfa
by_day_wfa
by_day_wfh
by_day_wfl
by_month_bmifa
by_month_lfa
by_month_wfa

let weight = 5.1
let length = 55.1
const ageInDays = 21
let obs = new Observation(SexSpecification.Female, { ageInDays })

console.log(`Consider a ${ageInDays}-day-old girl with a weight of ${weight} and length of ${length}.`)
obs.weightForAge(weight).then((result: string) => console.log("Girl's WFA " + result))
obs.lengthOrHeightForAge(length).then((result: string) => console.log("Girl's LFA " + result))
obs.weightForLength(weight, length).then((result: string) => console.log("Girl's WFL " + result))


weight = 11.1
length = 80.7
const dob = new Date(2020, 1, 1)
const dateOfObservation = new Date(2021, 7, 1)
obs = new Observation(SexSpecification.Male, { dob, dateOfObservation })

console.log(`Also consider a boy born ${dob} and observed ${dateOfObservation}. He weighed ${weight} and had length ${length}.`)
obs.weightForAge(weight).then((result: string) => console.log("Boy's WFA " + result))
obs.lengthOrHeightForAge(length).then((result: string) => console.log("Boy's LFA " + result))
obs.weightForLength(weight, length).then((result: string) => console.log("Boy's WFL " + result))
