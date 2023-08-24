import { Observation, SexSpecification } from "./index"


let weight = 5.1
let length = 55.1
const ageInDays = 21
let obs = new Observation(SexSpecification.Female, { ageInDays })

console.log(`Consider a ${ageInDays}-day-old girl with a weight of ${weight} and length of ${length}.`)
obs.weightForAge(weight).then(result => console.log("Girl's WFA " + result))
obs.lengthOrHeightForAge(length).then(result => console.log("Girl's LFA " + result))
obs.weightForLength(weight, length).then(result => console.log("Girl's WFL " + result))


weight = 11.1
length = 80.7
const dob = new Date(2020, 1, 1)
const dateOfObservation = new Date(2021, 7, 1)
obs = new Observation(SexSpecification.Male, { dob, dateOfObservation })

console.log(`Also consider a boy born ${dob} and observed ${dateOfObservation}. He weighed ${weight} and had length ${length}.`)
obs.weightForAge(weight).then(result => console.log("Boy's WFA " + result))
obs.lengthOrHeightForAge(length).then(result => console.log("Boy's LFA " + result))
obs.weightForLength(weight, length).then(result => console.log("Boy's WFL " + result))
