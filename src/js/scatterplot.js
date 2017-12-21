import * as d3 from 'd3'

const graphic = d3.select('.chart-container')
const tooltip = d3.select('.tooltip')

let indicators
const formatComma = d3.format(',.3s')
const formatSig = d3.format(',.2s')
const formatSigPercentage = d3.format('.3r')

let transitionDuration

function chooseFormat (value, indicator) {
  if (indicators[indicator].is_percentage) {
    return formatSigPercentage(value) + '%'
  } else if (indicators[indicator].no_formatting) {
    return formatSig(value)
  } else {
    return formatComma(value)
  }
}

function formatter (value) {
  return value.replace('G', ' billion').replace('M', ' million').replace('T', ' trillion')
}

const chart = scatterplot()
let el = d3.select('.chart')

function resize () {
  const sz = Math.min(el.node().offsetWidth, window.innerHeight)
  const height = 450
  chart.width(sz).height(height)
  el.call(chart)
}

function scatterplot () {
  const margin = {top: 20, right: 30, bottom: 60, left: 80}
  let scales = {
    r: d3.scaleSqrt(),
    x: {
      type: null,
      direction: 'bottom'
    },
    y: {
      type: null,
      direction: 'left'
    },
    c: null
  }

  let width = 0
  let height = 0
  let currentValues = {
    currentYear: null,
    axes: null
  }
  let colorDomain
  let selectedCountries = []

  function enter ({ container, data }) {
    const svg = container.selectAll('svg').data([data])
    const svgEnter = svg.enter().append('svg')
    const gEnter = svgEnter.append('g')

    const year = gEnter.append('g').attr('class', 'g-year')
    year.append('text').attr('class', 'chart-year')

    const guidelines = gEnter.append('g').attr('class', 'g-guidelines')
    guidelines.append('line').attr('class', 'chart-guidelines chart-guidelines--x')
    guidelines.append('line').attr('class', 'chart-guidelines chart-guidelines--y')
    guidelines.append('text').attr('class', 'chart-guidelines chart-guidelines-label--x')
    guidelines.append('text').attr('class', 'chart-guidelines chart-guidelines-label--y')

    const gAvg = gEnter.append('g').attr('class', 'g-mean')
    gAvg.append('line').attr('class', 'chart-mean-line')

    gEnter.append('g').attr('class', 'g-plot')

    const gMsg = gEnter.append('g').attr('class', 'g-message')
    gMsg.append('text').attr('class', 'chart-message')

    const axis = gEnter.append('g').attr('class', 'g-axis')

    const x = axis.append('g').attr('class', 'axis axis--x')

    const y = axis.append('g').attr('class', 'axis axis--y')

    x.append('text').attr('class', 'axis__label')
      .attr('text-anchor', 'start')

    y.append('text').attr('class', 'axis__label')
      .attr('text-anchor', 'end')

    // Legend
    const legendSVG = d3.select('.chart-radius-legend-svg').selectAll('svg').data([data])
    const legendSVGEnter = legendSVG.enter().append('svg')
    const legendGEnter = legendSVGEnter.append('g')
  }

  function scaleType (axis) {
    if (currentValues.axes[axis].scaleType == 'log') {
      return d3.scaleLog()
    }
    return d3.scaleLinear()
  }

  function updateScales ({ data }) {
    const maxR = 30

    scales.x.type = scaleType('x')
    scales.x.type
      .domain(currentValues.axes.x.range)
      .range([1, width])

    scales.y.type = scaleType('y')
    scales.y.type
      .domain(currentValues.axes.y.range)
      .range([height, 0])

    scales.r
      .domain(currentValues.axes.r.range)
      .range([2, maxR])

    scales.c = currentValues.scaleC
  }

  function updateDom ({ container, data }) {
    const svg = container.select('svg')

    svg
      .attr('viewBox', '0 0 ' + (width + margin.left + margin.right) + ' ' + (height + margin.top + margin.bottom) + '')

    const g = svg.select('g')
      .attr('transform', 'translate(' + (margin.left) + ',' + margin.top + ')')

    const plot = g.select('.g-plot')
    createBubbles(plot, data, 'ISO', 'main')
    createBubbles(plot, selectedCountries.countriesData, 'ISO-Year', 'selected')

    // Lines
    const lines = plot.selectAll('line.selectedLine').data(selectedCountries.countriesData, d => d['ISO-Year'])

    lines.attr('display', d => checkCurrentYear(d.year))

    lines.enter().append('line')
      .attr('data-iso', d => d['ISO-Year'])
      .attr('class', 'item selectedLine')
      .attr('fill', 'none')
      .attr('stroke', d => d3.color(checkIfChina(d.ISO, scales.c(d[colorDomain.value]))).darker(0.7))
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('stroke-width', 1.5)
      .attr('x2', d => scales.x.type(d[currentValues.axes.x.name]))
      .attr('y2', d => scales.y.type(d[currentValues.axes.y.name]))
      .attr('x1', d => scales.x.type(d.prevX))
      .attr('y1', d => scales.y.type(d.prevY))
      .merge(lines)
        .transition()
          .duration(transitionDuration)
          .attr('x2', d => scales.x.type(d[currentValues.axes.x.name]))
          .attr('y2', d => scales.y.type(d[currentValues.axes.y.name]))
          .attr('x1', d => scales.x.type(d.prevX))
          .attr('y1', d => scales.y.type(d.prevY))

    lines.exit().remove()
  }

  function createBubbles (plot, data, key, bubbleClass) {
    let circles = plot.selectAll('circle.' + bubbleClass).data(data, d => d[key])

    let bubbleTransition
    if (bubbleClass == 'selected') {
      bubbleTransition = function () {
        transition()
        .duration(transitionDuration)
        .attr('fill', '#000')
      }
    }

    circles.enter().append('circle')
      .attr('class', 'item' + ' ' + bubbleClass)
      .attr('data-country', d => d.country_eng)
      .attr('data-iso', d => d.ISO)
      .attr('data-year', d => d.year)
      .attr('r', d => scales.r(d[currentValues.axes.r.name]))
      .attr('cx', d => scales.x.type(d[currentValues.axes.x.name]))
      .attr('cy', d => scales.y.type(d[currentValues.axes.y.name]))
      .attr('fill', d => checkIfChina(d.ISO, scales.c(d[colorDomain.value])))
      .attr('stroke', d => d3.color(checkIfChina(d.ISO, scales.c(d[colorDomain.value]))).darker(0.7))
      .attr('display', d => checkCurrentYear(d.year))
      .attr('opacity', d => checkSelectedCountry(d))
      .on('mouseover', function (d) {
        let selectedItem = d3.select(this)
        mouseover(selectedItem, d, currentValues)
      })
      .on('mouseout', mouseout)
      .on('click', function (d) {
        let checkbox = '.filter-region input[value="' + d.ISO + '"]'
        let checked = d3.select(checkbox).property('checked')
        let newCheckVal = true
        if (checked) {
          newCheckVal = false
        }
        d3.select('input[name="comparison-country"][data-iso="' + d.ISO + '"]').property('checked', newCheckVal)
        d3.select(checkbox).property('checked', newCheckVal).on('change')()
      })
      .merge(circles)
        .attr('opacity', d => checkSelectedCountry(d))
        .transition()
          .duration(transitionDuration)
          .attr('data-year', d => d.year)
          .attr('r', d => scales.r(d[currentValues.axes.r.name]))
          .attr('cx', d => scales.x.type(d[currentValues.axes.x.name]))
          .attr('cy', d => scales.y.type(d[currentValues.axes.y.name]))
          .attr('fill', d => checkIfChina(d.ISO, scales.c(d[colorDomain.value])))
          .attr('stroke', d => d3.color(checkIfChina(d.ISO, scales.c(d[colorDomain.value]))).darker(0.7))
          .attr('display', d => checkCurrentYear(d.year))

    circles.exit().remove()
  }

  function checkIfChina (iso, defaultVal) {
    if (iso === 'CHN') {
      return getComputedStyle(document.body).getPropertyValue('--china-color')
    }
    return defaultVal
  }

  function checkCurrentYear (dataYear) {
    if (dataYear > currentValues.currentYear) {
      return 'none'
    }
  }

  function checkSelectedCountry (data) {
    if (selectedCountries.countries.length && selectedCountries.countries.indexOf(data.ISO) === -1) {
      return 0.4
    }
  }

  function updateAxis ({ container, data }) {
    const axis = container.select('.g-axis')

    let axisLeft
    let axisLeftScale
    let axisBottom
    let axisBottomScale;
    ['x', 'y'].forEach(function (axis) {
      if (scales[axis].direction == 'left') {
        axisLeftScale = axis
        axisLeft = d3.axisLeft(scales[axis].type).tickSizeOuter(0)

        if (currentValues.axes[axis].scaleType == 'log') {
          axisLeft.ticks(5, '.3s')
        }
      } else if (scales[axis].direction == 'bottom') {
        axisBottomScale = axis
        axisBottom = d3.axisBottom(scales[axis].type).tickSizeOuter(0).tickSizeInner(-height)

        if (currentValues.axes[axis].scaleType == 'log') {
          axisBottom.ticks(5, '.3s')
        }
      }
    })

    d3.selectAll('.tick.minor').classed('minor', false)
    let emptyTicks = d3.selectAll('.tick text:empty')
    emptyTicks.each(function (d) {
      d3.select(d3.select(this).node().parentNode).classed('minor', true)
    })

    const x = axis.select('.axis--x')
    const maxY = scales[axisLeftScale].type.range()[0]
    const offset = maxY

    x.attr('transform', 'translate(0,' + height + ')')
      .call(axisBottom)

    let xLabel = indicators[currentValues.axes[axisBottomScale].name][getLanguageProperty('name', currentValues.lang)]
    x.select('.axis__label')
      .attr('x', width / 2)
      .attr('y', margin.bottom - 5)
      .text(xLabel)

    const y = axis.select('.axis--y')

    y.call(axisLeft)

    let yLabel = indicators[currentValues.axes[axisLeftScale].name][getLanguageProperty('name', currentValues.lang)]
    y.select('.axis__label')
      .attr('y', 0 - (margin.left / 1.25))
      .attr('x', 0 - (height / 2))
      .attr('text-anchor', 'middle')
      .attr('transform', `rotate(-90)`)
      .text(yLabel)

    // Year
    const year = container.select('.g-year')
    year.attr('transform', 'translate(' + width + ', ' + height + ')')
    year.select('.chart-year')
      .attr('text-anchor', 'end')
      .transition()
        .duration(transitionDuration)
        .text(currentValues.currentYear)
  }

  function updateMeanLine ({ container, data }) {
    const line = container.select('.chart-mean-line')

    if (!indicators[currentValues.axes.x.name].needs_average_line && !indicators[currentValues.axes.y.name].needs_average_line) {
      return
    }

    if (data.length == 0) {
      line.classed('is-hidden', true)
      return
    } else {
      line.classed('is-hidden', false)
    }

    let avg = 0
    if (indicators[currentValues.axes.x.name].needs_average_line) {
      avg = d3.mean(data, function (d) {
        if (d.world_bank_classification == 4 || d.world_bank_classification == 5) {
          return +d[currentValues.axes.x.name]
        }
      })

      if (avg == 0 || avg == undefined) {
        line.classed('is-hidden', true)
        return
      } else {
        line.classed('is-hidden', false)
      }

      line
        .on('mouseover', function () {
          showAvgTooltip(indicators[currentValues.axes.x.name].name, 'test')
          let name = indicators[currentValues.axes.x.name][getLanguageProperty('name', currentValues.lang)]
          let unit = indicators[currentValues.axes.x.name][getLanguageProperty('units', currentValues.lang)]
          let amount = formatter(chooseFormat(avg, currentValues.axes.x.name)) + ' ' + unit
          showAvgTooltip(name, amount)
        })
        .on('mouseout', hideTooltip)
        .transition()
        .duration(transitionDuration)
          .attr('x1', scales.x.type(avg))
          .attr('y1', 0)
          .attr('x2', scales.x.type(avg))
          .attr('y2', height)
    } else if (indicators[currentValues.axes.y.name].needs_average_line) {
      avg = d3.mean(data, function (d) {
        if (d.world_bank_classification == 4 || d.world_bank_classification == 5) {
          return +d[currentValues.axes.y.name]
        }
      })
      if (avg == 0 || avg == undefined) {
        line.classed('is-hidden', true)
        return
      } else {
        line.classed('is-hidden', false)
      }

      line
        .on('mouseover', function () {
          let name = indicators[currentValues.axes.y.name][getLanguageProperty('name', currentValues.lang)]
          let unit = indicators[currentValues.axes.y.name][getLanguageProperty('units', currentValues.lang)]
          let amount = formatter(chooseFormat(avg, currentValues.axes.y.name)) + ' ' + unit
          showAvgTooltip(name, amount)
        })
        .on('mouseout', hideTooltip)
        .transition()
        .duration(transitionDuration)
          .attr('x1', 0)
          .attr('y1', scales.y.type(avg))
          .attr('x2', width)
          .attr('y2', scales.y.type(avg))
    }

    function showAvgTooltip (name, value) {
      tooltip.transition()
        .duration(200)
        .style('opacity', 0.9)
      tooltip.html(`
        <p class="tooltip-heading">${name} ${currentValues.currentYear}</p>
        <p class="tooltip-body">
          <span class="tooltip-label">Average:</span> ${value}</p>`)
        .style('visibility', 'visible')
        .style('left', d3.event.pageX + 'px')
        .style('top', d3.event.pageY + 'px')
    }
  }

  function updateLegends ({data}) {
    const svg = d3.select('.chart-radius-legend svg')
      .attr('width', '100%')
      .attr('height', '100px')

    const boundingClientRect = svg.node().getBoundingClientRect()

    const g = svg.select('g')

    g.selectAll('*').remove()

    const rect = g.append('rect')
      .attr('class', 'radius-legend-bg')
      .attr('width', '100%')
      .attr('height', '100%')

    const radiusLegend = g.selectAll('.radius-legend-circles').data(scales.r.domain().reverse())
    radiusLegend.enter().append('circle')
      .attr('class', 'radius-legend-circles')
      .attr('cx', boundingClientRect.width / 2)
      .attr('cy', boundingClientRect.height / 2)
      .attr('r', d => scales.r(d))

    g.append('circle')
      .attr('class', 'radius-legend-circle-ring')
      .attr('cx', boundingClientRect.width / 2)
      .attr('cy', boundingClientRect.height / 2)
      .attr('r', 0)

    d3.selectAll('.radius-legend-circles').select(function (d) {
      const boundingClientRect = this.getBoundingClientRect()
      g.append('text')
        .attr('x', parseFloat(this.getAttribute('cx')) + boundingClientRect.width / 2)
        .attr('y', parseFloat(this.getAttribute('cy')) + boundingClientRect.height / 2)
        .attr('class', 'radius-legend-label')
        .text(formatter(chooseFormat(d, currentValues.axes.r.name)))
    })
  }

  function updateMessage ({container, data}) {
    let msgContainer = container.select('.g-message .chart-message')
    if (data.length) {
      msgContainer.text(null)
    } else {
      msgContainer
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .text('There is no data available for this year.')
    }
  }

  function chart (container) {
    const data = container.datum()

    enter({ container, data })
    updateScales({ container, data })
    updateDom({ container, data })
    updateAxis({ container, data })
    updateMeanLine({container, data})
    updateMessage({container, data})
    // updateLegends({ container, data })
  }

  chart.width = function (...args) {
    if (!args.length) return width
    width = args[0]
    return chart
  }

  chart.height = function (...args) {
    if (!args.length) return height
    height = args[0]
    return chart
  }

  chart.currentValues = function (...args) {
    if (!args.length) return currentValues
    currentValues = args[0]
    return chart
  }

  chart.colorDomain = function (...args) {
    if (!args.length) return colorDomain
    colorDomain = args[0]
    return chart
  }

  chart.selectedCountries = function (...args) {
    if (!args.length) return selectedCountries
    selectedCountries = args[0]
    return chart
  }

  chart.updateGuidelines = function (d, action = 'show') {
    const guidelines = d3.select('.g-guidelines')

    if (action == 'show') {
      guidelines.classed('active', true)
      guidelines.select('.chart-guidelines--x')
        .attr('x1', scales.x.type(d[currentValues.axes.x.name]))
        .attr('y1', scales.y.type(d[currentValues.axes.y.name]))
        .attr('x2', scales.x.type(d[currentValues.axes.x.name]))
        .attr('y2', height)

      guidelines.select('.chart-guidelines-label--x')
        .attr('x', scales.x.type(d[currentValues.axes.x.name]))
        .attr('y', height + 30)
        .text(chooseFormat(d[currentValues.axes.x.name], currentValues.axes.x.name))

      guidelines.select('.chart-guidelines--y')
        .attr('x1', scales.x.type(d[currentValues.axes.x.name]))
        .attr('y1', scales.y.type(d[currentValues.axes.y.name]))
        .attr('x2', 0)
        .attr('y2', scales.y.type(d[currentValues.axes.y.name]))

      guidelines.select('.chart-guidelines-label--y')
        .attr('y', -35)
        .attr('x', scales.y.type(d[currentValues.axes.y.name]) * -1)
        .attr('transform', 'rotate(-90)')
        .text(chooseFormat(d[currentValues.axes.y.name], currentValues.axes.y.name))
    } else {
      guidelines.classed('active', false)
    }
  }

  chart.updateRadiusLegend = function (d, action = 'show') {
    if (action == 'show') {
      d3.select('.radius-legend-circle-ring').attr('r', scales.r(d[currentValues.axes.r.name]))
    } else {
      d3.select('.radius-legend-circle-ring').attr('r', 0)
    }
  }

  return chart
}

function mouseover (item, d, currentValues) {
  // Unselect previous item
  d3.selectAll('.item:not(.isActive)').style('fill', null).style('stroke-width', null).style('fill-opacity', '0.4')

  item.style('fill', function () {
    return d3.rgb(item.attr('fill')).brighter(0.75)
  })
  .style('stroke-width', 1.5)
  .style('fill-opacity', 1)
  showTooltip(d, item, currentValues)
  chart.updateGuidelines(d, 'show')
  chart.updateRadiusLegend(d, 'show')
}

function mouseout (d) {
  if (!d3.select(this).classed('isActive')) {
    d3.selectAll('.item').style('fill-opacity', null)
    d3.select(this).style('fill', null).style('stroke-width', null).style('fill-opacity', null)
    hideTooltip()
    chart.updateGuidelines(null, 'hide')
    chart.updateRadiusLegend(null, 'hide')
  }
}

function showTooltip (d, item, currentValues) {
  let xPos = d3.event.pageX
  let yPos = d3.event.pageY

  let tooltipBody = ''
  let axes = ['x', 'y', 'r']
  axes.forEach(function (axis) {
    tooltipBody += formatTooltipValue(currentValues.axes[axis].name, d[currentValues.axes[axis].name])
  })

  tooltip.transition()
    .duration(200)
    .style('opacity', 0.9)
  tooltip.html(`
    <p class="tooltip-heading">${d[getLanguageProperty('country', currentValues.lang)]} ${d.year}</p>
    <p class="tooltip-body">${tooltipBody}</p>`)
    .style('visibility', 'visible')
    .style('left', xPos + 'px')
    .style('top', yPos + 'px')

  function formatTooltipValue (key, value) {
    let label = indicators[key][getLanguageProperty('name', currentValues.lang)]
    let unit = indicators[key][getLanguageProperty('units', currentValues.lang)]
    let needsPercentage = false
    let amount
    if (indicators[key].is_prefix) {
      amount = unit + formatter(chooseFormat(value, indicators[key].name))
    } else {
      amount = formatter(chooseFormat(value, indicators[key].name)) + ' ' + unit
    }
    return `<span class="tooltip-label">${label}:</span> ${amount}<br />`
  }
}

function hideTooltip () {
  tooltip.transition()
    .duration(500)
    .style('opacity', 0)
    .on('end', function () {
      d3.select(this)
        .style('visibility', 'hidden')
    })
}

function getLanguageProperty (property, lang) {
  return property + '_' + lang
}

function init (args) {
  el = d3.select(args.container)
  el.datum(args.data)
  chart.currentValues(args.currentValues)
  chart.colorDomain(args.colorDomain)
  chart.selectedCountries(args.selectedCountries)
  indicators = args.indicators
  transitionDuration = args.transitionDuration
  el.call(chart)
  resize()
}

export default { init, resize, mouseover, hideTooltip }
