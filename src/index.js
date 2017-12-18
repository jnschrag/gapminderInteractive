import * as plot from './js/createPlot'
import Data from './data/20171218-basic.csv'
import './scss/main.scss'
import intro from 'intro.js'
const introJs = intro.introJs()

function init () {
  plot.createPlot(Data)
  introJs.start()
}

window.addEventListener('DOMContentLoaded', init)
