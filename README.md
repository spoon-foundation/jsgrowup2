# jsgrowup2

This package calculates z scores for the growth measurements of children. The
indicators it supports are:

* weight-for-age
* length/height-for-age
* weight-for-length/height
* BMI-for-age
* arm circumference-for-age (MUAC)
* head circumference-for-age

These are all based on the
[WHO Child Growth Standards](http://www.who.int/childgrowth/standards/en/).

It is a port of the Python-based pygrowup2, which is itself a fork of the original
pygrowup, by Evan Wheeler.

See demo for an example of usage. This implementation is modeled based on an
"observation" of a child. The age of the child at the time of the observation
is captured either explicitly, or inferred based on the child's date of birth
and the date of the observation. Once an Observation object is instantiated,
multiple methods are available to compute the z-scores for the various indicators.

* armCircumferenceForAge
* bmiForAge
* headCircumferenceForAge
* lengthOrHeightForAge
* weightForAge
* weightForHeight
* weightForLength


You may run the tests with `yarn test`. The tests are based on two datasets:
one originating from the R implementation of WHO's igrowup software, and the
other based on data SPOON collected and processed using the Stata version of
igrowup. Using the WHO data, this package's z-scores are generally within 0.1
of the test datasets (there are two inexplicable exceptions). However, a number
of results differ by at least 0.05. It's not clear if that's due to the other
implementations' use of floating point arithmetic (in contrast with this package's
use of the decimal library for more precise computation) or if there are small
inaccuracies in this package. So, caveat emptor!

Credits
=======

The initial implementation of this work was by [SPOON](http://www.spoonfoundation.org).
It was inspired by Evan Wheeler's work in Python for pygrowup as well as
[jsgrowup](https://github.com/GlobalStrategies/jsgrowup) by Global Strategies.
