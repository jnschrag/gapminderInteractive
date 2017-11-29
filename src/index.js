import * as d3 from 'd3'
import chart from './js/scatterplot'
import './scss/main.scss'

let windowWidth = window.innerWidth
const noUiSlider = require('./js/nouislider')
const yearRange = document.getElementById('year-range')
const searchWarning = d3.select('.search-warning')
let data
let years
let minYear
let maxYear
let currentYear
let axisVars = []
let playing = false

let currentX = 'Life Expectancy' // hard coded
let currentY = 'GNI per capita' // hard coded
let currentRadius = 'Gross Domestic Product (PPP)' // hard coded

const COLORS = ['#58a897', '#83badc', '#3b75bb', '#a483a8', '#f7890e', '#69518d', '#f7d768', '#8cb561', '#728c99']
const scaleC = d3.scaleOrdinal()
  .domain(['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'])
  .range(COLORS)

function loadData () {
  const dataCSV = require('./data/cpp-lifeexpectancy-20171127-test.csv')

  let obj = dataCSV.reduce(function (data, row) {
    if (axisVars.length == 0) {
      axisVars = Object.keys(row)
    }

    data.regions = data.regions || {}
    data.regions[row.Region] = data.regions[row.Region] || {}
    data.regions[row.Region][row.ISO] = data.regions[row.Region][row.ISO] || {
      country: row.Country,
      iso: row.ISO
    }

    data.years = data.years || {}
    data.years[row.Year] = data.years[row.Year] || []
    data.years[row.Year].push(row)

    data.countries = data.countries || {}
    data.countries[row.ISO] = data.countries[row.ISO] || {
      country: row.Country,
      iso: row.ISO,
      years: []
    }
    data.countries[row.ISO].years.indexOf(row.Year) === -1 ? data.countries[row.ISO].years.push(row.Year) : ''

    return data
  }, {})

  data = obj
  years = Object.keys(data.years)
  let range = d3.extent(years)
  minYear = range[0]
  maxYear = range[1]
}

function primaryItemClick () {
  let items = d3.selectAll('.item')

  items.on('click', function (d) {
    console.log('click')
  })
}

function setupAxisSelect () {
  var xSelect = d3.select('.filter-axis-x')
    .append('select')
      .attr('name', 'axis-x')

  // Add Options
  var xOptions = xSelect
    .selectAll('option')
    .data(axisVars).enter()
    .append('option')
      .text(function (d) { return d })
      .property('value', function (d) { return d })
      .property('selected', function (d) { return d === currentX })

  // Detect Change
  xSelect.on('change', function () {
    drawPrimaryChart()
  })

  var ySelect = d3.select('.filter-axis-y')
    .append('select')
      .attr('name', 'axis-y')

  // Add Options
  var yOptions = ySelect
    .selectAll('option')
    .data(axisVars).enter()
    .append('option')
      .text(function (d) { return d })
      .property('value', function (d) { return d })
      .property('selected', function (d) { return d === currentY })

  // Detect Change
  ySelect.on('change', function () {
    drawPrimaryChart()
  })

  var rSelect = d3.select('.filter-radius')
    .append('select')
      .attr('name', 'radius')

  // Add Options
  var rOptions = rSelect
    .selectAll('option')
    .data(axisVars).enter()
    .append('option')
      .text(function (d) { return d })
      .property('value', function (d) { return d })
      .property('selected', function (d) { return d === currentRadius })

  // Detect Change
  rSelect.on('change', function () {
    drawPrimaryChart()
  })
}

function calculateXSelect () {
  return d3.select('.filter-axis-x select').property('value')
}

function calculateYSelect () {
  return d3.select('.filter-axis-y select').property('value')
}

function calculateRadiusSelect () {
  return d3.select('.filter-radius select').property('value')
}

function setupRegionFilter () {
  const regionCont = d3.select('.filter-region')
  data.regions.forEach(function (region) {
    let checkbox = regionCont.append('div')
      .attr('class', 'checkbox-container')
    checkbox.append('input')
      .attr('type', 'checkbox')
      .attr('name', 'region')
      .attr('id', region)
      .attr('value', region)
      .attr('checked', function () { if (region === 'All') return true })

    checkbox.append('label')
      .attr('for', region)
      .text(region)

    checkbox.selectAll('label:not([for="All"])').append('div')
      .attr('class', 'dot')
      .style('background-color', function () { if (region !== 'All') { return scaleC(region) } })
  })

  d3.selectAll('input[name="region"]').on('change', function () {
    let value = this.value
    const checkedBoxes = document.querySelectorAll('input[name="region"]')

    if (value === 'All') {
      checkedBoxes.forEach(function (option) {
        if (option.value != 'All') {
          option.checked = false
        } else {
          option.checked = true
        }
      })
    } else {
      let checkedCount = 0
      checkedBoxes.forEach(function (option, index) {
        if (option.value === 'All') {
          option.checked = false
        }

        if (option.checked == true) {
          checkedCount++
        }
      })

      // If no regions are checked, default to All
      if (checkedCount === 0) {
        document.querySelector('.filter-region input[value="All"]').checked = true
      }
    }

    drawPrimaryChart(data)
  })
}

function calculateRegions () {
  let regions = []
  const checkedBoxes = document.querySelectorAll('input[name="region"]:checked')
  checkedBoxes.forEach(function (region) {
    regions.push(region.value)
  })
  return regions
}

function setupYearRange () {
  if (yearRange.noUiSlider != undefined) {
    yearRange.noUiSlider.destroy()
  }

  noUiSlider.create(yearRange, {
    start: [ minYear ],
    connect: true, // Display a colored bar between the handles
    behaviour: 'tap-drag', // Move handle on tap, bar is draggable
    step: 1,
    tooltips: true,
    animate: true,
    range: {
      'min': +minYear,
      'max': +maxYear
    },
    pips: {
      mode: 'count',
      values: 5,
      density: 5
    },
    format: {
      to: function (value) {
        return value
      },
      from: function (value) {
        return value
      }
    }
  })

  yearRange.noUiSlider.on('update', function () {
    console.log('update!')
    drawPrimaryChart()
  })

  setupPlayBtn()
}

function calculateYears () {
  return yearRange.noUiSlider.get()
}

function setupPlayBtn () {
  const playBtn = d3.select('#playbtn')

  var timer  // create timer object
  playBtn
    .on('click', function () {  // when user clicks the play button
      if (playing == false) {  // if the map is currently playing
        timer = setInterval(function () {   // set a JS interval
          yearRange.noUiSlider.set(currentYear + 1)
        }, 2000)

        d3.select(this).html('stop')  // change the button label to stop
        playing = true   // change the status of the animation
      } else {    // else if is currently playing
        console.log('currentYear: ' + currentYear)
        console.log('maxYear: ' + maxYear)
        if (currentYear == maxYear) {
          clearInterval(timer)   // stop the animation by clearing the interval
          d3.select(this).html('play')   // change the button label to play
          playing = false   // change the status again
        }
      }
    })
}

function drawPrimaryChart () {
  // let regions = calculateRegions()
  currentYear = calculateYears()
  currentX = calculateXSelect()
  currentY = calculateYSelect()
  currentRadius = calculateRadiusSelect()

  console.log(currentYear)

  let dataset = data.years[currentYear]

  chart.init({
    data: dataset,
    currentX: currentX,
    currentY: currentY,
    currentRadius: currentRadius,
    container: '.chart-primary'
  })
}

function resize () {
  if (windowWidth != window.innerWidth) {
    windowWidth = window.innerWidth
    chart.resize()
  }
}

function init () {
  loadData()
  // setupRegionFilter()
  setupAxisSelect()
  setupYearRange()
  drawPrimaryChart()
}

window.addEventListener('DOMContentLoaded', init)
window.addEventListener('resize', resize)
