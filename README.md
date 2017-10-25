# About this interactive
This interactive is inspired by the visualization made popular by the Gapminder foundation. 

The code has been adapted from [the example by Mike Boston](https://bost.ocks.org/mike/nations/). Another example is a [Re-recreation by Romain Vuillemot](https://romsson.github.io/dragit/example/nations.html)

This visualization makes a couple of additions/deviations from the Bostock example. 

1) d3.transition() works quite differently, in order to make a smooth transition from one year to another. The makes one 30 second transition that tweens the year while this interactive makes chained transition() calls
2) In the absence of data, circles assume last known position/first known position or the lower bound of the domain (in that order)