import * as plot from './js/createPlot'
import Data from './data/advanced-data-20171220.csv'
import Indicators from './data/advanced-indicators-20171221-1.csv'
import './scss/main.scss'
import intro from 'intro.js'

const introJs = intro.introJs()
let plotted
let breakpoint = calculateBreakpoint()

function init () {
  plotted = plot.createPlot({
  	data: Data,
  	indicators: Indicators,
  	useHints: true
  })
  plotted.init()
  loadIntro()
}

function loadIntro () {
  setupRestartTourBtn()
  if (breakpoint == 'xsmall' || breakpoint == 'small') {

  } else {
	  assignAnnotations()
	  setupTourBtns()
  }
}

function setupTourBtns () {
  let introBtn = document.querySelector('.btn-intro')
  introBtn.addEventListener('click', event => {
  	hideLanding()
    startIntro()
  })

  let chartBtn = document.querySelector('.btn-chart')
  chartBtn.addEventListener('click', function () {
    exploreChart()
  })
}

function setupRestartTourBtn () {
  let restartBtn = document.querySelector('.btn-intro-restart')
  restartBtn.addEventListener('click', function () {
  	plotted.resetChart()
    startIntro()
  })
}

function exploreChart () {
  let overlays = document.querySelectorAll('.introjs-overlay')
  overlays.forEach(function (element) { element.remove() })
  setupHints()
}

function hideLanding () {
  updateDom.hideLanding()
}

function startIntro () {
  introJs.start()
  introWatchStepChange()
}

function assignAnnotations () {
  introJs.setOptions({
  	skipLabel: 'Skip the Tour',
  	hidePrev: true,
  	hideNext: true,
  	doneLabel: 'Use the Tracker',
  	showStepNumbers: false,
    steps: [
    	{
    		intro: '<p>China’s transformation from a developing country into an emerging global power is likely to be one of the most consequential factors in twenty-first century international politics. Its economy is now the second largest in the world, and in the process hundreds of millions of people have been lifted out of poverty.</p><p>Yet questions persist as to whether China is a developed or developing country – or both.</p><p>The China Development Tracker empowers users to explore various indicators of development, and compare China with other countries.</p>',
    		tooltipClass: 'intro-firstSlide'
	    },
	    {
        	element: document.querySelector('circle[data-iso="CHN"]'),
        	intro: 'Each country is represented as a bubble. The size of each bubble is determined by the size of a country’s economy.',
        	position: 'right',
        	tooltipClass: 'intro-circleSelect'
	    },
	    {
        	element: document.querySelector('.filter-axis-x'),
        	intro: 'The X-Axis represents per capita income.',
        	position: 'left'
	    },
	    {
        	element: document.querySelector('.chart-color-legend'),
        	intro: 'The colors of each bubble correspond to the income groups assigned by the World Bank.',
        	position: 'bottom'
	    },
	    {
        	element: document.querySelector('.chart-primary'),
        	intro: 'The interactive is currently set to 1990. You can see that two and a half decades ago China was much poorer than wealthy countries like the United States.',
        	position: 'right'
	    },
	    {
        	element: document.querySelector('.filter-axis-y'),
        	intro: 'Use the Y-Axis to select a social indicator, such as life expectancy.',
        	position: 'left'
	    },
	    {
        	element: document.querySelector('.chart-mean-line'),
        	intro: 'The purple horizontal line represents the average value for high-income economies. For life expectancy, you can see that in 1990 this average was 75.3 years.',
        	position: 'right'
	    },
	    {
        	element: document.querySelector('.chart-container'),
        	intro: 'Use the play button to see how these indicators have changed over time.',
        	position: 'bottom'
	    },
	    {
        	element: document.querySelector('.chart-primary'),
        	intro: 'By 2015, the size of China’s economy increased by more than 10 times, per capita incomes rose by a factor of 25, and average life expectancy increased by almost seven years. Importantly, China’s life expectancy in 2015 remained three and a half years behind the average of high-income economies.',
        	position: 'right'
	    },
	    {
        	element: document.querySelector('.chart-primary'),
        	intro: '<p>The Development Tracker makes it easy to visually compare the development levels of different countries.</p><p>For instance, when comparing China to India and South Africa, we can see that all three countries have followed very different paths.</p>',
        	position: 'right'
	    },
	    {
	    	intro: '<p>The Development Tracker is preloaded with several economic and social indicators.</p><p>We hope this tool helps you to better understand China’s level of development. Enjoy!</p>'
	    }
    ]
  })
}

function introWatchStepChange () {
  introJs.onbeforechange(function (targetElement) {
  	let currentStep = this._currentStep
    if (currentStep == 4) {
    	updateDom.highlightCountries({
    		show: ['USA', 'CHN'],
    		hide: ['ZAF', 'IND']
    	})
    } else if (currentStep == 7) {
    	plotted.resetChart()
    	updateDom.playTimeline()
    } else if (currentStep == 9) {
    	updateDom.highlightCountries({
    		show: ['CHN', 'ZAF', 'IND'],
    		hide: ['USA']
    	})
    } else if (currentStep == 10) {
    	updateDom.highlightCountries({
    		hide: ['USA', 'CHN', 'ZAF', 'IND']
    	})
    	plotted.updateTransitionLength()
    }
  })

  introJs.onchange(function (targetElement) {
  	let currentStep = this._currentStep
  	if (currentStep == 1 || currentStep == 5) {
    	document.querySelector('.introjs-tooltipReferenceLayer').classList.add('intro-circleSelectRef')
  	} else if (currentStep != 0) {
  		document.querySelector('.introjs-tooltipReferenceLayer').classList.remove('intro-circleSelectRef')
  	}
  })

  introJs.onexit(function () {
  	plotted.resetChart()
  })
}

let updateDom = {
  hideLanding: function () {
    document.body.classList.toggle('is-relative')
  	document.querySelector('.landing-container').classList.toggle('is-hidden')
  	document.querySelector('.landing-content').classList.toggle('is-hidden')
  },
  highlightCountries: function (args) {
  	if (args.hide) {
	    args.hide.forEach(function (country) {
	  		let checkbox = document.querySelector('input#' + country)
	  		checkbox.checked = false
	  	})
	  }
	  if (args.show) {
	    args.show.forEach(function (country) {
	  		let checkbox = document.querySelector('input#' + country)
	  		checkbox.checked = true
	  	})
	  }
	  plotted.drawChart()
  },
  playTimeline: function () {
  	plotted.updateTransitionLength(300)
    document.querySelector('#playbtn').click()
  }
}

function setupHints () {
  introJs.setOptions({
    hintPosition: 'middle-left'
  })
  let axes = ['x', 'y', 'c', 'r']
  axes.forEach(function (axis) {
    let filter = document.querySelector('.filter-axis-' + axis)

    if (axis == 'c') {
    	document.querySelector('.filter-axis-c').setAttribute('data-hintPosition', 'middle-right')
    }

    filter.addEventListener('change', function (e) {
    	document.querySelector('.introjs-hints').innerHTML = ''
    	introJs.addHints()
	  	introJs.showHints()
  	})
  })
  introJs.showHints()
}

function calculateBreakpoint () {
  return getComputedStyle(document.body).getPropertyValue('--breakpoint').replace(/\"/g, '')
}

function resize () {
  breakpoint = calculateBreakpoint()
  loadIntro()
}

window.addEventListener('DOMContentLoaded', init)
window.addEventListener('resize', resize)
