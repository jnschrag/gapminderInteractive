# About this interactive
This interactive is inspired by the visualization made popular by the Gapminder foundation. 

The code has been adapted from [the example by Mike Boston](https://bost.ocks.org/mike/nations/). Another example is a [Re-recreation by Romain Vuillemot](https://romsson.github.io/dragit/example/nations.html)

This visualization makes a couple of additions/deviations from the Bostock example. 

1) d3.transition() works quite differently, in order to make a smooth transition from one year to another. The makes one 30 second transition that tweens the year while this interactive makes chained transition() calls
2) In the absence of data, circles assume last known position/first known position or the lower bound of the domain (in that order)

# Extensibility
This interactive currently uses the `GDF_iLab.csv` file as its dataset. Future interactives can use this interactive as long as the new dataset follows the same structure as `GDF_iLab.csv`

There are, however, some hard coded variables that you will need to change before the code works. These are hard coded to ensure consistency with the defaults that were in place in the original gapminder (x-axis was Percieved Rule of Law, y-axis was Regulatory Quality, color was always world bank classification code)

Most hard coded lines can be found in `interactive.js` and are followed by a `// hard coded` comment

There is also one hard coded line in `index.html` which you may want to change

`<input type="range" id="slider" min="1995" max="2015" value="1995" step="1" onchange="yearChange(this.value)">`   