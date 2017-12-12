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
    row['ISO-Year'] = row.ISO + '-' + row.Year

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
    // data.years[row.Year].sort(dynamicSort('ISO'))

    // Group Countries
    data.countries = data.countries || {}
    data.countries[row.ISO] = data.countries[row.ISO] || {
      country: row.Country,
      iso: row.ISO,
      years: {}
    }
    data.countries[row.ISO].years[row.Year] = data.countries[row.ISO].years[row.Year] || row

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
  return [...new Set(data.raw.map(column => parseInt(column[colorValue])))]
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
  const regionsCont = d3.select('.filter-region')
  const regions = Object.keys(data.regions).sort()

  regions.forEach(function (region) {
    regionsCont.append('h3')
      .attr('class', 'accordion-toggle')
      .text(region)
      .on('click', function () {
        d3.select(this.nextSibling).classed('collapsed', !d3.select(this.nextSibling).classed('collapsed'))
      })
    let regionCont = regionsCont.append('div')
      .attr('class', 'region-containers accordion-content collapsed')
      .attr('id', 'region-' + region)

    let countries = Object.keys(data.regions[region])
    let options = regionCont.selectAll('.option').data(countries)

    options.enter().append('label')
      .data(countries)
      .text(d => data.regions[region][d].country)
      .append('input')
        .attr('name', 'country')
        .attr('class', 'checkboxes')
        .attr('type', 'checkbox')
        .attr('value', d => d)
        .attr('data-country', d => d)
  })

  d3.selectAll('input[name="country"]').on('change', function () {
    drawPrimaryChart(data)
  })
}

function calculateSelectedCountries () {
  let result = { countries: [] }
  let countries = []
  const checkedBoxes = document.querySelectorAll('input[name="country"]:checked')
  checkedBoxes.forEach(function (country) {
    let iso = country.value
    let countryData = Object.values(data.countries[iso].years)
    countries.push(countryData)
    result.countries.push(iso)
  })
  result.countriesData = [].concat.apply([], countries)
  return result
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
    drawPrimaryChart()
    if (currentYear == maxYear) {
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

        d3.select(this)
          .classed('active', true)
        .select('span')
          .attr('class', 'pause-icon')
        playing = true
      } else {
        stopAnimation(playBtn, timer)
      }
    })
}

function stopAnimation (playBtn, timer) {
  clearInterval(timer)
  playBtn.classed('active', false).select('span').attr('class', 'play-icon')
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
  let selectedCountries = calculateSelectedCountries()
  currentYear = calculateYears()
  currentX = calculateXSelect()
  currentY = calculateYSelect()
  currentRadius = calculateRadiusSelect()

  let sortedData = removeEmptyDataPoints(data.years[currentYear]).sort(dynamicSort('-' + currentRadius))

  // If countries are selected, remove any empty data points and sort it by Year so the most recent year is always on top. Then remove that countries data from the existing array and append all of its data to the end of the existing array.
  if (selectedCountries.countriesData.length) {
    let selectedCountriesData = removeEmptyDataPoints(selectedCountries.countriesData).sort(dynamicSort('Year'))

    selectedCountries.countriesData = selectedCountriesData

    let filteredData = sortedData.filter(function (country) {
      return !selectedCountries.countries.includes(country.ISO)
    })

    sortedData = [].concat.apply(filteredData, selectedCountriesData)
  }

  chart.init({
    data: sortedData,
    currentYear: currentYear,
    currentX: currentX,
    currentY: currentY,
    currentRadius: currentRadius,
    currentRanges: {x: ranges[currentX], y: ranges[currentY], r: ranges[currentRadius]},
    colorDomain: colorDomain,
    selectedCountries: selectedCountries,
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
  setupRegionFilter()
  setupAxisSelect()
  setupYearRange()
}

function dynamicSort (property, comparisonType = 'string') {
  var sortOrder = 1
  if (property[0] === '-') {
    sortOrder = -1
    property = property.substr(1)
  }
  return function (a, b) {
    if (comparisonType == 'string') {
      var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0
    } else {
      var result = a[property] - b[property]
    }
    return result * sortOrder
  }
}

window.addEventListener('DOMContentLoaded', init)
window.addEventListener('resize', resize)
