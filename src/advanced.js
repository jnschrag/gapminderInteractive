import * as plot from './js/createPlot'
import Data from './data/20171214-data.csv'
import './scss/main.scss'
import intro from 'intro.js'

const introJs = intro.introJs()

function init () {
  plot.createPlot(Data)
  assignAnnotations()
}

function assignAnnotations () {
  introJs.setOptions({
    steps: [
    	{
    		intro: 'hello world!'
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

window.addEventListener('DOMContentLoaded', init)
