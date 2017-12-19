import * as plot from './js/createPlot'
import Data from './data/advanced-20171219.csv'
import './scss/main.scss'
import intro from 'intro.js'

const introJs = intro.introJs()

function init () {
  plot.createPlot(Data)
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
    console.log('go directly to chart')
  })
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
  	document.querySelector('.landing-container').classList.toggle('landing-container')
  	landingContent.classList.toggle('is-hidden')
    startIntro()
  })
}

function startIntro () {
  // const chartSidebar = document.querySelector('.chart-sidebar')
  // chartSidebar.classList.toggle('is-hidden')
  introJs.start()
  introWatchStepChange()
}

function assignAnnotations () {
  introJs.setOptions({
    steps: [
    	{
    		intro: 'China’s transformation from a developing country into an emerging global power is likely to be one of the most consequential factors in twenty-first century international politics. Its economy is now the second largest in the world, and in the process hundreds of millions of people have been lifted out of poverty.'
    	},
    	{
	        element: document.querySelector('.sidebar'),
	        intro: 'Test assigning a step'
	    },
	    {
        element: document.querySelector('.filter-swap-axes'),
        intro: 'this is the second step!'
	    }
    ]
  })

  // introJs.start()
}

function introWatchStepChange () {
  introJs.onbeforechange(function (targetElement) {
  	let currentStep = this._currentStep
    if (currentStep == 1) {
    	console.log('step 1')
    	updateDom.showSidebar()
    }
  })
}

let updateDom = {
  showSidebar: function () {
    document.querySelector('.chart-container').classList.toggle('col-md-9')
    document.querySelector('.sidebar').classList.toggle('is-hidden')
  }
}

window.addEventListener('DOMContentLoaded', init)
