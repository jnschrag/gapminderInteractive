import * as d3 from 'd3'

const graphic = d3.select('.chart-container')
const tooltip = d3.select('.tooltip')

const formatComma = d3.format(',')
const formatAmount = d3.format('.3s')
const formatPercentage = d3.format('.3')

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

    gEnter.append('g').attr('class', 'g-plot')

    const axis = gEnter.append('g').attr('class', 'g-axis')

    const x = axis.append('g').attr('class', 'axis axis--x')

    const y = axis.append('g').attr('class', 'axis axis--y')

    x.append('text').attr('class', 'axis__label')
      .attr('text-anchor', 'start')

    y.append('text').attr('class', 'axis__label')
      .attr('text-anchor', 'end')

    const guidelines = gEnter.append('g').attr('class', 'g-guidelines')
    guidelines.append('line').attr('class', 'chart-guidelines chart-guidelines--x')
    guidelines.append('line').attr('class', 'chart-guidelines chart-guidelines--y')
    guidelines.append('text').attr('class', 'chart-guidelines chart-guidelines-label--x')
    guidelines.append('text').attr('class', 'chart-guidelines chart-guidelines-label--y')

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
      .domain(currentValues.axes.radius.range)
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
    const lines = plot.selectAll('line.item').data(selectedCountries.countriesData, d => d['ISO-Year'])

    lines.attr('display', d => checkCurrentYear(d.Year))

    lines.enter().append('line')
      .attr('data-iso', d => d['ISO-Year'])
      .attr('class', 'item')
      .attr('fill', 'none')
      .attr('stroke', d => d3.color(scales.c(d[colorDomain.value])).darker(0.7))
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('stroke-width', 1.5)
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
        .duration(1000)
        .attr('fill', '#000')
      }
    }

    circles.enter().append('circle')
      .attr('class', 'item' + ' ' + bubbleClass)
      .attr('data-country', d => d.Country)
      .attr('data-iso', d => d.ISO)
      .attr('data-year', d => d.Year)
      .attr('r', d => scales.r(d[currentValues.axes.radius.name]))
      .attr('cx', d => scales.x.type(d[currentValues.axes.x.name]))
      .attr('cy', d => scales.y.type(d[currentValues.axes.y.name]))
      .attr('fill', d => scales.c(d[colorDomain.value]))
      .attr('stroke', d => d3.color(scales.c(d[colorDomain.value])).darker(0.7))
      .attr('display', d => checkCurrentYear(d.Year))
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

        d3.select(checkbox).property('checked', newCheckVal).on('change')()
      })
      .merge(circles)
        .attr('opacity', d => checkSelectedCountry(d))
        .transition()
          .duration(1000)
          .attr('data-year', d => d.Year)
          .attr('r', d => scales.r(d[currentValues.axes.radius.name]))
          .attr('cx', d => scales.x.type(d[currentValues.axes.x.name]))
          .attr('cy', d => scales.y.type(d[currentValues.axes.y.name]))
          .attr('fill', d => scales.c(d[colorDomain.value]))
          .attr('stroke', d => d3.color(scales.c(d[colorDomain.value])).darker(0.7))
          .attr('display', d => checkCurrentYear(d.Year))

    circles.exit().remove()
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
          axisLeft.ticks(3).tickFormat(d => formatAmount(d))
        }
      } else if (scales[axis].direction == 'bottom') {
        axisBottomScale = axis
        axisBottom = d3.axisBottom(scales[axis].type).tickSizeOuter(0).tickSizeInner(-height)

        if (currentValues.axes[axis].scaleType == 'log') {
          axisBottom.ticks(3).tickFormat(d => formatAmount(d))
        }
      }
    })

    const x = axis.select('.axis--x')
    const maxY = scales[axisLeftScale].type.range()[0]
    const offset = maxY

    x.attr('transform', 'translate(0,' + height + ')')
      .call(axisBottom)

    x.select('.axis__label')
      .attr('x', width / 2)
      .attr('y', margin.bottom / 1.5)
      .text(currentValues.axes[axisBottomScale].name)

    const y = axis.select('.axis--y')

    y.call(axisLeft)

    y.select('.axis__label')
      .attr('y', 0 - (margin.left / 1.5))
      .attr('x', 0 - (height / 2))
      .attr('text-anchor', 'middle')
      .attr('transform', `rotate(-90)`)
      .text(currentValues.axes[axisLeftScale].name)

    // Year
    const year = container.select('.g-year')
    year.attr('transform', 'translate(' + width + ', ' + height + ')')
    year.select('.chart-year')
      .attr('text-anchor', 'end')
      .transition()
        .duration(1000)
        .text(currentValues.currentYear)
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
        .text(formatter(formatAmount(d)))
    })
  }

  function chart (container) {
    const data = container.datum()

    enter({ container, data })
    updateScales({ container, data })
    updateDom({ container, data })
    updateAxis({ container, data })
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
        .attr('y2', height - 15)

      guidelines.select('.chart-guidelines-label--x')
        .attr('x', scales.x.type(d[currentValues.axes.x.name]))
        .attr('y', height - 1)
        .text(formatComma(d[currentValues.axes.x.name]))

      guidelines.select('.chart-guidelines--y')
        .attr('x1', scales.x.type(d[currentValues.axes.x.name]))
        .attr('y1', scales.y.type(d[currentValues.axes.y.name]))
        .attr('x2', 15)
        .attr('y2', scales.y.type(d[currentValues.axes.y.name]))

      guidelines.select('.chart-guidelines-label--y')
        .attr('y', 13.5)
        .attr('x', scales.y.type(d[currentValues.axes.y.name]) * -1)
        .attr('transform', 'rotate(-90)')
        .text(formatComma(d[currentValues.axes.y.name]))
    } else {
      guidelines.classed('active', false)
    }
  }

  chart.updateRadiusLegend = function (d, action = 'show') {
    if (action == 'show') {
      d3.select('.radius-legend-circle-ring').attr('r', scales.r(d[currentValues.axes.radius.name]))
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

  tooltip.transition()
    .duration(200)
    .style('opacity', 0.9)
  tooltip.html(`<p class="tooltip-heading">${d.Country} ${d.Year}</p>
    <p class="tooltip-body">
    <span class="tooltip-label">${currentValues.axes.x.name}:</span> ${formatComma(d[currentValues.axes.x.name])}<br />
    <span class="tooltip-label">${currentValues.axes.y.name}:</span> ${formatComma(d[currentValues.axes.y.name])}<br />
    <span class="tooltip-label">${currentValues.axes.radius.name}:</span> ${formatter(formatAmount(d[currentValues.axes.radius.name]))}<br />
    </p>`)
    .style('left', xPos + 'px')
    .style('top', yPos + 'px')
}

function hideTooltip () {
  tooltip.transition()
    .duration(500)
    .style('opacity', 0)
}

function init (args) {
  el = d3.select(args.container)
  el.datum(args.data)
  chart.currentValues(args.currentValues)
  chart.colorDomain(args.colorDomain)
  chart.selectedCountries(args.selectedCountries)
  el.call(chart)
  resize()
}

export default { init, resize, mouseover, hideTooltip }
