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
let axes = ['x', 'y', 'r']
let axisVars = {}
let axesSelect = {}
let ranges = {}

const playBtn = d3.select('#playbtn')
let timer
let playing = false

let current = {
  x: 'Life Expectancy',
  y: 'GNI per capita',
  r: 'Gross Domestic Product (PPP)'
}

let currentX = 'Life Expectancy' // hard coded
let currentY = 'GNI per capita' // hard coded
let currentRadius = 'Gross Domestic Product (PPP)' // hard coded

const colorValue = 'World Bank Classification'
let colorDomain = {
  value: colorValue,
  colors: []
}

function loadData () {
  const dataCSV = require('./data/20171207-data.csv')

  let obj = dataCSV.reduce(function (data, row) {
    data.axisVars = data.axisVars || []
    if (data.axisVars.length == 0) {
      data.axisVars = Object.keys(row)
    }

    // Modify row properties
    row = transformKeys(row)

    // Group Regions
    data.regions = data.regions || {}
    data.regions[row.Region] = data.regions[row.Region] || {}
    data.regions[row.Region][row.ISO] = data.regions[row.Region][row.ISO] || {
      country: row.Country,
      iso: row.ISO
    }

    // Group Years
    data.years = data.years || {}
    data.years[row.Year] = data.years[row.Year] || []
    data.years[row.Year].push(row)
    data.years[row.Year].sort(function (a, b) { return (a.ISO > b.ISO) ? 1 : ((b.ISO > a.ISO) ? -1 : 0) })

    // Group Countries
    data.countries = data.countries || {}
    data.countries[row.ISO] = data.countries[row.ISO] || {
      country: row.Country,
      iso: row.ISO,
      years: []
    }
    data.countries[row.ISO].years.indexOf(row.Year) === -1 ? data.countries[row.ISO].years.push(row.Year) : ''

    // All data
    data.raw = data.raw || []
    data.raw.push(row)

    return data
  }, {})

  data = obj
  console.log(data)
  // console.log(data)

  setupAxisVars(data.axisVars)

  years = Object.keys(data.years)
  let range = d3.extent(years)
  minYear = range[0]
  maxYear = range[1]
}

function transformKeys (obj) {
  return Object.keys(obj).reduce(function (o, prop) {
    if (isNaN(parseInt(obj[prop]))) {
      var value = obj[prop]
    } else {
      var value = parseInt(obj[prop])
    }
    var newProp = prop.replace('x_', '').replace('y_', '').replace('r_', '')
    o[newProp] = value
    return o
  }, {})
}

function setupAxisVars (columns) {
  axes.forEach(function (axis) {
    axisVars[axis] = columns.filter(column => column.includes(axis + '_'))
      .map(column => column.split('_').pop())
    calculateRanges(axisVars[axis])
  })
}

function calculateRanges (axis) {
  axis.forEach(function (column) {
    ranges[column] = d3.extent(data.raw.reduce(function (result, value) {
      if (value[column] != '') {
        result.push(parseInt(value[column]))
      }
      return result
    }, []))
  })
}

function calculateColors () {
  // return d3.extent(data.raw.reduce(function (result, value) {
  //   if (value[colorValue] != '') {
  //     result.push(parseInt(value[colorValue]))
  //   }
  //   return result
  // }, []))
  return [...new Set(data.raw.map(column => parseInt(column[colorValue])))];
}

function primaryItemClick () {
  let items = d3.selectAll('.item')

  items.on('click', function (d) {
    console.log('click')
  })
}

function setupAxisSelect () {
  axes.forEach(function (axis) {
    axesSelect[axis] = d3.select('.filter-axis-' + axis)
      .append('select')
      .attr('name', 'axis-' + axis)

    let options = axesSelect[axis]
      .selectAll('option')
      .data(axisVars[axis]).enter()
      .append('option')
        .text(d => d)
        .property('value', d => d)
        .property('selected', d => d === current[axis])

    axesSelect[axis].on('change', function () {
      drawPrimaryChart()
    })
  })
}

function calculateXSelect () {
  return d3.select('.filter-axis-x select').property('value')
}

function calculateYSelect () {
  return d3.select('.filter-axis-y select').property('value')
}

function calculateRadiusSelect () {
  return d3.select('.filter-axis-r select').property('value')
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
    if ( currentYear == maxYear ) {
      stopAnimation(playBtn, timer)
    }
  })

  setupPlayBtn()
}

function calculateYears () {
  return yearRange.noUiSlider.get()
}

function setupPlayBtn () {
  playBtn
    .on('click', function () {
      if (playing == false) {
        timer = setInterval(function () {
          yearRange.noUiSlider.set(currentYear + 1)
        }, 1000)

        d3.select(this).html('stop')
        playing = true
      } else {
          stopAnimation(playBtn, timer)
      }
    })
}

function stopAnimation(playBtn, timer) {
  clearInterval(timer)
  playBtn.html('play')
  playing = false
}

function removeEmptyDataPoints (data) {
  let filtered = data.filter(function (column) {
    if (column[currentX] && column[currentY]) {
      return column
    }
  })
  return filtered
}

function drawPrimaryChart () {
  // let regions = calculateRegions()
  currentYear = calculateYears()
  currentX = calculateXSelect()
  currentY = calculateYSelect()
  currentRadius = calculateRadiusSelect()

  let dataset = removeEmptyDataPoints(data.years[currentYear])

  chart.init({
    data: dataset,
    currentX: currentX,
    currentY: currentY,
    currentRadius: currentRadius,
    currentRanges: {x: ranges[currentX], y: ranges[currentY], r: ranges[currentRadius]},
    colorDomain: colorDomain,
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
  colorDomain.colors = calculateColors()
  // setupRegionFilter()
  setupAxisSelect()
  setupYearRange()
  // drawPrimaryChart()
}

window.addEventListener('DOMContentLoaded', init)
// window.addEventListener('resize', resize)
