import * as d3 from 'd3'
import * as sidebar from './sidebar'
import chart from './scatterplot'
import autoComplete from './autocomplete'
import '../scss/main.scss'

function createPlot (args) {
  let windowWidth = window.innerWidth
  const noUiSlider = require('./nouislider')
  const yearRange = document.getElementById('year-range')
  const searchWarning = d3.select('.search-warning')

  let lang

  let data
  let years
  let minYear
  let maxYear
  let currentYear

  let indicators = {}
  let axes = ['x', 'y', 'r', 'c']
  let axisVars = {
    x: [],
    y: [],
    r: [],
    c: []
  }
  let axesSelect = {}
  let ranges = {}
  let scaleTypes = ['linear', 'log']

  const playBtn = d3.select('#playbtn')
  let timer
  let playing = false
  let defaultTransitionDuration = 1000
  let transitionDuration = defaultTransitionDuration

  let currentAxes = {
    x: {
      direction: 'bottom'
    },
    y: {
      direction: 'left'
    },
    r: {
    },
    c: {

    }
  }

  let scaleC = d3.scaleOrdinal()
  let colorDomain = {
    value: null,
    colors: []
  }
  const COLORS = ['#d3d3d3', '#58a897', '#83badc', '#3b75bb', '#a483a8', '#f7890e']

  function loadData () {
    let obj = args.data.reduce(function (data, row) {
      // Modify row properties
      row['ISO-Year'] = row.ISO + '-' + row.year

      // Group Regions
      let region = row['region_' + lang]
      data.regions = data.regions || {}
      data.regions[region] = data.regions[region] || {}
      data.regions[region][row.ISO] = data.regions[region][row.ISO] || {
        country: row['country_' + lang],
        iso: row.ISO
      }

      // Group Years
      data.years = data.years || {}
      data.years[row.year] = data.years[row.year] || []
      data.years[row.year].push(row)

      // Group Countries
      data.countries = data.countries || {}
      data.countries[row.ISO] = data.countries[row.ISO] || {
        country: row['country_' + lang],
        iso: row.ISO,
        years: {}
      }
      data.countries[row.ISO].years[row.year] = data.countries[row.ISO].years[row.year] || row

      // All data
      data.raw = data.raw || []
      data.raw.push(row)

      return data
    }, {})

    data = obj

    loadIndicators()

    years = Object.keys(data.years)
    let range = d3.extent(years)
    minYear = range[0]
    maxYear = range[1]
  }

  function loadIndicators () {
    let result = args.indicators.map(function (indicator) {
      indicators[indicator.name] = indicator

      if (indicator.type === 'title') {
        updatePageTitle(indicator)
        return
      }

      if (indicator.default_axis) {
        setupAxisVars(indicator)
      }

      if (indicator.type != 'color') {
        indicator.range = calculateRanges(indicator.name)
      }
    })
  }

  function setupAxisVars (indicator) {
    let axes = indicator.default_axis.split(',')
    axes.forEach(function (axis) {
      axisVars[axis].push(indicator.name)

      if (indicator.is_default_value == 1) {
        currentAxes[axis].name = indicator.name

        if (indicator.is_logged_default == 1) {
          currentAxes[axis].scaleType = 'log'
        } else {
          currentAxes[axis].scaleType = 'linear'
        }
      }
    })
  }

  function calculateRanges (indicator) {
    return d3.extent(data.raw.reduce(function (result, value) {
      if (value[indicator] != '') {
        result.push(parseInt(value[indicator]))
      }
      return result
    }, []))
  }

  function updatePageTitle (indicator) {
    d3.select('h1.title').text(indicator['name_' + lang])
  }

  function calculateColors () {
    return [...new Set(data.raw.map(column => column[currentAxes.c.name] || 0))].sort()
  }

  function setupAxisSelect () {
    axes.forEach(function (axis) {
      axesSelect[axis] = d3.select('.filter-axis-' + axis)
        .append('select')
        .attr('name', 'axis-' + axis)
        .attr('class', 'filter-select axis-variable')

      let options = axesSelect[axis]
        .selectAll('option')
        .data(axisVars[axis]).enter()
        .append('option')
          .text(d => indicators[d]['name_' + lang])
          .property('value', d => d)
          .property('selected', d => d === currentAxes[axis].name)

      if (axis == 'x' || axis == 'y') {
        setupAxisSelectType(axis)
      } else if (axis == 'c') {
        setupColorLegend()
      }

      d3.selectAll('.axis-variable').on('change', function () {
        drawPrimaryChart()
      })
    })
  }

  function setupAxisSelectType (axis) {
    axesSelect[axis] = d3.select('.filter-axis-' + axis)
      .append('select')
      .attr('name', 'axis-scaleType-' + axis)
      .attr('class', 'filter-select axis-scaleType')

    let options = axesSelect[axis]
      .selectAll('option')
      .data(scaleTypes).enter()
      .append('option')
        .text(d => d.charAt(0).toUpperCase() + d.slice(1))
        .property('value', d => d)
        .property('selected', d => d === currentAxes[axis].scaleType)

    d3.selectAll('.axis-scaleType').on('change', function () {
      drawPrimaryChart()
    })
    setupAxesDirection()
  }

  function calculateXSelect () {
    return d3.select('.filter-axis-x .axis-variable').property('value')
  }

  function calculateYSelect () {
    return d3.select('.filter-axis-y .axis-variable').property('value')
  }

  function calculateRadiusSelect () {
    return d3.select('.filter-axis-r .axis-variable').property('value')
  }

  function calculateScaleTypes (axis) {
    return d3.select('select[name="axis-scaleType-' + axis + '"]').property('value')
  }

  function setupAxesDirection () {
    const axesDirection = d3.select('.filter-swap')
      .on('click', function () {
        // Swap Variables
        let oldX = axisVars.x
        let oldY = axisVars.y
        axisVars.x = oldY
        axisVars.y = oldX

        // Swap Indicators & Scale Types
        let oldXScaleName = currentAxes.x.name
        let oldYScaleName = currentAxes.y.name
        currentAxes.x.name = oldYScaleName
        currentAxes.y.name = oldXScaleName
        let oldXScaleType = currentAxes.x.scaleType
        let oldYScaleType = currentAxes.y.scaleType
        currentAxes.x.scaleType = oldYScaleType
        currentAxes.y.scaleType = oldXScaleType

        // Remove & Redraw
        d3.selectAll('.axis-variable').remove()
        d3.selectAll('.axis-scaleType').remove()
        setupAxisSelect()

        // Destroy Lines so they are redrawn
        stopAnimation(playBtn, timer)
        // console.log(d3.selectAll('.selectedLine'))
        // d3.selectAll('.selectedLine').remove()
        drawPrimaryChart()
      })
  }

  function setupColorLegend () {
    colorDomain.colors = calculateColors()
    const colorCont = d3.select('.chart-color-legend')
    const colorContList = colorCont.select('.chart-color-legend-list')
    colorContList.selectAll('*').remove()
    const colorLegend = colorContList.append('ul')

    colorDomain.colors.push('China')
    if (colorDomain.colors[0] != 0) {
      colorDomain.colors.unshift(0)
    }

    scaleC.domain(colorDomain.colors)
      .range(COLORS)

    // Move No Data to End of list
    colorDomain.colors.push(colorDomain.colors.shift())

    let items = colorLegend.selectAll('li').data(colorDomain.colors)
    items.enter().append('li')
      .attr('class', d => 'color' + d)
      .html(function (d) {
        let label = d
        if (d == 0) {
          label = 'No Data'
        }
        return '<span style="background-color:' + scaleC(d) + '"></span>' + label
      })

    colorContList.append('div').attr('class', 'clear')
  }

  function calculateColorSelect () {
    return d3.select('.filter-axis-c .axis-variable').property('value')
  }

  function setupRegionFilter () {
    const regionsCont = d3.select('.filter-region')
    const regions = Object.keys(data.regions).sort()

    regions.forEach(function (region) {
      regionsCont.append('h3')
        .attr('class', 'accordion-toggle')
        .text(region)
        .on('click', function () {
          d3.select(this).classed('open', !d3.select(this).classed('open'))
          d3.select(this.nextSibling).classed('collapsed', !d3.select(this.nextSibling).classed('collapsed'))
        })
      let regionCont = regionsCont.append('div')
        .attr('class', 'region-containers accordion-content collapsed')
        .attr('id', 'region-' + region)

      let countries = Object.keys(data.regions[region])
      let options = regionCont.selectAll('.option').data(countries)

      options.enter().append('div')
        .data(countries)
        .attr('class', 'checkbox-container')
        .append('input')
          .attr('name', 'country')
          .attr('class', 'checkboxes')
          .attr('type', 'checkbox')
          .attr('id', d => d)
          .attr('value', d => d)
          .attr('data-country', d => d)
    })

    d3.selectAll('.checkbox-container').append('label')
        .attr('for', d => d)
        .text(d => data.countries[d].country)

    d3.selectAll('input[name="country"]').on('change', function () {
      drawPrimaryChart()
    })

    regionsCont.append('button')
      .attr('class', 'clear-filter')
      .text('Clear selected countries')
      .on('click', function () {
        d3.selectAll('input[name="country"]').property('checked', false)
        drawPrimaryChart()
      })
  }

  function calculateSelectedCountries () {
    let result = { countries: [] }
    let countries = []
    const checkedBoxes = document.querySelectorAll('input[name="country"]:checked')
    checkedBoxes.forEach(function (country) {
      let iso = country.value
      for (let i = minYear; i <= maxYear; i++) {
        let prevYear = i - 1
        if (i == minYear) {
          prevYear = i
        }

        data.countries[iso].years[i].prevX = data.countries[iso].years[prevYear][currentAxes.x.name] || data.countries[iso].years[i][currentAxes.x.name]
        data.countries[iso].years[i].prevY = data.countries[iso].years[prevYear][currentAxes.y.name] || data.countries[iso].years[i][currentAxes.y.name]
      }
      let countryData = Object.values(data.countries[iso].years)
      countries.push(countryData)
      result.countries.push(iso)
    })
    result.countries.sort()
    result.countriesData = [].concat.apply([], countries)
    showSelectedTooltip(result.countries)

    return result
  }

  function showSelectedTooltip (selectedCountries) {
    let tooltips = d3.selectAll('.tooltip-selected').data(selectedCountries, d => d)

    tooltips.transition()
      .duration(transitionDuration)
      .style('left', d => checkPos('pageX', 'left', 'scrollX', d) + 'px')
      .style('top', d => checkPos('pageY', 'top', 'scrollY', d) + 'px')

    tooltips.enter().append('div')
      .attr('class', 'tooltip tooltip-selected')
      .attr('data-iso', d => d)
      .html(d => `<p class="tooltip-heading">${data.countries[d].country}</p>`)
      .style('left', d => checkPos('pageX', 'left', 'scrollX', d) + 'px')
      .style('top', d => checkPos('pageY', 'top', 'scrollY', d) + 'px')
      .on('click', function (d) {
        let checkbox = '.filter-region input[value="' + d + '"]'
        let checked = d3.select(checkbox).property('checked')
        let newCheckVal = true
        if (checked) {
          newCheckVal = false
        }

        d3.select(checkbox).property('checked', newCheckVal).on('change')()
      })

    tooltips.exit().remove()

    function checkPos (event, direction, scroll, d) {
      if (d3.event && d3.event.target.__data__ != undefined && d3.event.target.__data__.ISO == d) {
        return d3.event[event]
      } else {
        return d3.selectAll('circle[data-iso="' + d + '"][data-year="' + currentYear + '"]').node().getBoundingClientRect()[direction] + window[scroll]
      }
    }
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
        values: 6,
        density: 4
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

    calculateYearRange(currentAxes.x.name, currentAxes.y.name)

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

  function calculateYearRange (currentX, currentY) {
    if (indicators[currentX].min_years || indicators[currentY].min_years) {
      let minX = indicators[currentX].min_years || minYear
      let minY = indicators[currentY].min_years || minYear
      minYear = Math.max(minX, minY)
    }

    if (indicators[currentX].max_years || indicators[currentY].max_years) {
      let maxX = indicators[currentX].max_years || maxYear
      let maxY = indicators[currentY].max_years || maxYear
      maxYear = Math.min(maxX, maxY)
    }

    yearRange.noUiSlider.updateOptions({
      range: {
        'min': +minYear,
        'max': +maxYear
      }
    })
  }

  function setupPlayBtn () {
    playBtn
      .on('click', function () {
        if (playing == false) {
          timer = setInterval(function () {
            yearRange.noUiSlider.set(currentYear + 1)
          }, transitionDuration)

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

  function removeEmptyDataPoints (data, disableCheckboxes = true) {
    let filtered = data.filter(function (column) {
      if (column[currentAxes.x.name] && column[currentAxes.y.name]) {
        if (disableCheckboxes) {
          d3.select('.checkbox-container #' + column.ISO).property('disabled', false)
        }
        return column
      } else {
        if (disableCheckboxes) {
          d3.select('.checkbox-container #' + column.ISO).property('disabled', true)
        }
      }
    })
    return filtered
  }

  function search () {
    var autocomplete = new autoComplete({
      selector: 'input[name="country-search"]',
      delay: 100,
      minChars: 1,
      source: function (term, suggest) {
        term = term.toLowerCase()
        var choices = Object.values(data.countries).map(obj => [obj.iso, obj.country])
        var matches = []
        var suggestions = []
        for (let i = 0; i < choices.length; i++) {
          if (~(choices[i][1]).toLowerCase().indexOf(term)) suggestions.push(choices[i])
        }
        suggest(suggestions)
      },
      renderItem: function (item, search) {
        searchWarning.text(null)
        search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
        var re = new RegExp('(' + search.split(' ').join('|') + ')', 'gi')
        return '<div class="autocomplete-suggestion" data-name="' + item[1] + '" data-iso="' + item[0] + '" data-val="' + search + '">' + item[1].replace(re, '<strong>$1</strong>') + '</div>'
      },
      onSelect: function (e, term, selectedItem) {
        e.preventDefault()
        let iso = selectedItem.getAttribute('data-iso')
        searchItem(iso)
      }
    })

    document.querySelector('input[name="country-search"]').onkeypress = function (e) {
      if (!e) e = window.event
      var keyCode = e.keyCode || e.which
      searchWarning.text(null)
      if (keyCode == '13') {
        let capitalize = this.value.charAt(0).toUpperCase() + this.value.slice(1)
        let lowercase = this.value.toLowerCase()
        let selectedItem = document.querySelector('[data-val="' + capitalize + '"') || document.querySelector('[data-val="' + lowercase + '"')
        let iso = selectedItem.getAttribute('data-iso')
        searchItem(iso)

        // Enter pressed
        return false
      }
    }
  }

  function searchItem (iso) {
    if (!data.countries[iso]) {
      searchWarning.text('No data available for this item')
      return
    }

    let itemInput = d3.select('input[name="country"]#' + iso)
    if (itemInput.property('disabled')) {
      searchWarning.text('No data available for this item for the current year.')
      return
    }

    itemInput.property('checked', true).on('change')()
  }

  function drawPrimaryChart () {
    let selectedCountries = calculateSelectedCountries()
    currentYear = calculateYears()
    let oldXName = currentAxes.x.name
    currentAxes.x.name = calculateXSelect()
    currentAxes.x.scaleType = calculateScaleTypes('x')
    let oldYName = currentAxes.y.name
    currentAxes.y.name = calculateYSelect()
    currentAxes.y.scaleType = calculateScaleTypes('y')
    currentAxes.r.name = calculateRadiusSelect()

    if (currentAxes.x.name != oldXName || currentAxes.y.name != oldYName) {
      calculateYearRange(currentAxes.x.name, currentAxes.y.name)
    }

    let colorIndicator = calculateColorSelect()
    let oldColor = currentAxes.c.name
    currentAxes.c.name = colorIndicator
    colorDomain.value = currentAxes.c.name
    if (colorIndicator != oldColor) {
      setupColorLegend()
    }

    let sortField = '-' + currentAxes.r.name
    let sortedData = removeEmptyDataPoints(data.years[currentYear]).sort(dynamicSort(sortField, 'num'))

    // If countries are selected, remove any empty data points and sort it by Year so the most recent year is always on top. Then remove that countries data from the existing array and append all of its data to the end of the existing array.
    if (selectedCountries.countriesData.length) {
      let selectedCountriesData = removeEmptyDataPoints(selectedCountries.countriesData, false).sort(dynamicSortMultiple('ISO', 'Year'))

      selectedCountries.countriesData = selectedCountriesData

      let filteredData = sortedData.filter(function (country) {
        return !selectedCountries.countries.includes(country.ISO)
      })
    }

    currentAxes.x.range = indicators[currentAxes.x.name].range
    currentAxes.y.range = indicators[currentAxes.y.name].range
    currentAxes.r.range = indicators[currentAxes.r.name].range

    let currentValues = {
      currentYear: currentYear,
      scaleC: scaleC,
      axes: currentAxes,
      lang: lang
    }

    chart.init({
      data: sortedData,
      currentValues: currentValues,
      colorDomain: colorDomain,
      selectedCountries: selectedCountries,
      indicators: indicators,
      transitionDuration: transitionDuration,
      container: '.chart-primary'
    })
  }

  function hideLoading () {
    d3.select('.loading-container').style('display', 'none')
  }

  function initSidebar () {
    if (windowWidth <= 768) {
      sidebar.sidebarMobile()
    }
  }

  function resize () {
    if (windowWidth != window.innerWidth) {
      windowWidth = window.innerWidth
      chart.resize()
      initSidebar()
    }
  }

  function checkLanguage () {
    lang = 'eng'
  }

  function init () {
    checkLanguage()
    loadData()
    setupRegionFilter()
    search()
    setupAxisSelect()
    setupYearRange()
    initSidebar()
    hideLoading()
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

  function dynamicSortMultiple () {
    /*
     * save the arguments object as it will be overwritten
     * note that arguments object is an array-like object
     * consisting of the names of the properties to sort by
     */
    var props = arguments
    return function (obj1, obj2) {
      var i = 0, result = 0, numberOfProperties = props.length
        /* try getting a different result from 0 (equal)
         * as long as we have extra properties to compare
         */
      while (result === 0 && i < numberOfProperties) {
        result = dynamicSort(props[i])(obj1, obj2)
        i++
      }
      return result
    }
  }

  window.addEventListener('resize', resize)

  return {
    init: function () {
      init()
    },
    drawChart: function () {
      drawPrimaryChart()
    },
    updateTransitionLength: function (duration) {
      transitionDuration = duration || defaultTransitionDuration
    }
  }
}

export { createPlot }
