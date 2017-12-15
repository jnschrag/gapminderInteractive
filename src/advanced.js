import * as plot from './js/createPlot'
import Data from './data/20171214-data.csv'
import './scss/main.scss'

function init () {
  plot.createPlot(Data)
}

window.addEventListener('DOMContentLoaded', init)
