import * as plot from './js/createPlot'
import Data from './data/advanced-data-20171219.csv'
import Indicators from './data/advanced-indicators-20171219.csv'
import './scss/main.scss'
import intro from 'intro.js'

const introJs = intro.introJs()
let plotted

function init () {
  plotted = plot.createPlot({
  	data: Data,
  	indicators: Indicators
  })
  plotted.init()
  assignAnnotations()
  setupBtns()
}

function setupBtns () {
  let introBtn = document.querySelector('.btn-intro')
  introBtn.addEventListener('click', event => {
    updateLandingText()
  })

  let chartBtn = document.querySelector('.btn-chart')
  chartBtn.addEventListener('click', function () {
    exploreChart()
  })
}

function exploreChart () {
  let overlays = document.querySelectorAll('.introjs-overlay')
  overlays.forEach(function (element) { element.remove() })
  updateDom.showSidebar()
  updateDom.showColors()
  updateDom.showTimeline()
}

function updateLandingText () {
  let landingContent = document.querySelector('.landing-content')
  landingContent.innerHTML = `
  	<p class="first">China’s transformation from a developing country into an emerging global power is likely to be one of the most consequential factors in twenty-first century international politics. Its economy is now the second largest in the world, and in the process hundreds of millions of people have been lifted out of poverty.</p>
  	<p class="second">Yet questions persist as to whether China is a developed or developing country – or both.</p>
  	<p class="third">This Development Tracker empowers users to compare various economic and social indicators of development, and compare China’s level of development with other countries.</p>
  	<button class="btn btn-startIntro">Next</button>
  	`
  let introBtn = document.querySelector('.btn-startIntro')
  introBtn.addEventListener('click', event => {
  	document.body.classList.toggle('is-relative')
  	document.querySelector('.landing-container').classList.toggle('is-hidden')
  	landingContent.classList.toggle('is-hidden')
    startIntro()
  })
}

function startIntro () {
  updateDom.showSidebar()
  introJs.start()
  introWatchStepChange()
}

function assignAnnotations () {
  introJs.setOptions({
    steps: [
    	{
	        intro: 'Decades of breakneck economic growth have left questions as to China’s level of development.'
	    },
	    {
        	element: document.querySelector('.filter-axis-r'),
        	intro: 'The Development Tracker represents each country in the world as a bubble. The size of each bubble is determined by the size of a country’s economy.',
        	position: 'left'
	    },
	    {
        	element: document.querySelector('.filter-axis-x'),
        	intro: 'The X-Axis represents per capita income.',
        	position: 'left'
	    },
	    {
        	element: document.querySelector('.chart-color-legend'),
        	intro: 'The colors of each bubble correspond to the four income groups assigned by the World Bank.',
        	position: 'bottom'
	    },
	    {
        	element: document.querySelector('.chart-primary'),
        	intro: 'The interactive is currently set to 1990. You can see that two and a half decades ago China was much poorer than wealthy countries like the United States.',
        	position: 'right'
	    },
	    {
        	element: document.querySelector('.chart-primary'),
        	intro: 'The Development Tracker enables users to compare the relationship between economic growth and social development.',
        	position: 'right'
	    },
	    {
        	element: document.querySelector('.chart-mean-line'),
        	intro: 'The purple horizontal line represents the average value for development economies. For life expectancy, you can see that in 1990 this average was [FILL IN] years',
        	position: 'right'
	    },
	    {
        	element: document.querySelector('.chart-container'),
        	intro: 'Use the play button to see how these factors have changed over time.',
        	position: 'bottom'
	    },
	    {
        	element: document.querySelector('.chart-primary'),
        	intro: 'By 2015, we can see the size of China’s economy [FILL IN], per capita income [FILL IN], and average life expectancy increased by [FILL IN] years.',
        	position: 'right'
	    },
	    {
        	element: document.querySelector('.chart-primary'),
        	intro: 'The Development Tracker makes it easy to visually compare the development levels of different countries.',
        	position: 'right'
	    },
	    {
        	element: document.querySelector('.chart-primary'),
        	intro: 'Since 2000, we can see that India, Russia, and China have followed very different paths in terms of income and life expectancy.',
        	position: 'right'
	    },
	    {
        	element: document.querySelector('.sidebar'),
        	intro: 'The Development Tracker is preloaded with several economic and social indicators.',
        	position: 'left'
	    },
	    {
        	intro: 'We hope this tool helps you to better understand China’s level development. Enjoy!'
	    }
    ]
  })
}

function introWatchStepChange () {
  introJs.onbeforechange(function (targetElement) {
  	let currentStep = this._currentStep
    if (currentStep == 3) {
    	updateDom.showColors()
    } else if (currentStep == 4) {
    	updateDom.highlightCountries({
    		show: ['USA', 'CHN']
    	})
    } else if (currentStep == 7) {
    	updateDom.showTimeline()
    	updateDom.playTimeline()
    } else if (currentStep == 10) {
    	updateDom.highlightCountries({
    		show: ['CHN', 'RUS', 'IND'],
    		hide: ['USA']
    	})
    } else if (currentStep == 11) {
    	updateDom.highlightCountries({
    		hide: ['USA', 'CHN', 'RUS', 'IND']
    	})
    	plotted.updateTransitionLength()
    }
  })
}

let updateDom = {
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
  },
  showColors: function () {
    document.querySelector('.chart-color-legend').classList.toggle('is-hidden')
  },
  showSidebar: function () {
    document.querySelector('.chart-container').classList.toggle('col-md-9')
    document.querySelector('.sidebar').classList.toggle('is-hidden')
    plotted.drawChart()
  },
  showTimeline: function () {
    document.querySelector('#timeline').classList.toggle('is-hidden')
  }
}

window.addEventListener('DOMContentLoaded', init)
