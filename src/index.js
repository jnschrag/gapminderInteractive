import * as plot from './js/createPlot'
import Data from './data/20171218-basic.csv'
import './scss/main.scss'

function init () {
  plot.createPlot(Data)
}

window.addEventListener('DOMContentLoaded', init)
