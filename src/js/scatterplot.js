import * as d3 from 'd3'

const graphic = d3.select('.chart-container')
const tooltip = d3.select('.tooltip')

const COLORS = ['#58a897', '#83badc', '#3b75bb', '#a483a8', '#f7890e', '#69518d', '#f7d768', '#8cb561', '#728c99']
const FONT_SIZE = 11
const MAX_VAL = 100
const formatAmount = d3.format('.1s')
const formatPercentage = d3.format('.3')
const formatLegend = d3.format('$' + '.3s')

const chart = scatterplot()
let el = d3.select('.chart')

function resize () {
  const sz = Math.min(el.node().offsetWidth, window.innerHeight)
  const height = 550
  chart.width(sz).height(height)
  el.call(chart)
}

function scatterplot () {
  const margin = {top: 20, right: 30, bottom: 40, left: 60}
  const scaleX = d3.scaleLinear()
  const scaleY = d3.scaleLog()
  const scaleR = d3.scaleSqrt()
  const scaleC = d3.scaleOrdinal()

  let width = 0
  let height = 0
  let currentX
  let currentY
  let currentRadius
  let currentRanges
  let colorDomain
  let currentYear
  let selectedCountries = []

  function translate (x, y) {
    return `translate(${x}, ${y})`
  }

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
  }

  function updateScales ({ data }) {
    const maxR = 30

    scaleX
      .domain(currentRanges.x)
      .range([1, width])

    scaleY
      .domain(currentRanges.y)
      .range([height, 0])

    scaleR
      .domain(currentRanges.r)
      .range([2, maxR])

    scaleC
      .domain(colorDomain.colors)
      .range(COLORS)
  }

  function updateDom ({ container, data }) {
    const svg = container.select('svg')

    svg
      .attr('viewBox', '0 0 ' + (width + margin.left + margin.right) + ' ' + (height + margin.top + margin.bottom) + '')

    const g = svg.select('g')
      .attr('transform', 'translate(' + (margin.left) + ',' + margin.top + ')')

    const plot = g.select('.g-plot')

    const circles = plot.selectAll('circle.item').data(data, d => d.ISO)

    // circles
    //   .attr('data-year', d => d.Year)
    //   .transition()
    //     .duration(1000)
    //     .attr('r', d => scaleR(d[currentRadius]))
    //     .attr('cx', d => scaleX(d[currentX]))
    //     .attr('cy', d => scaleY(d[currentY]))
    //     .attr('fill', d => scaleC(d[colorDomain.value]))
    //     .attr('stroke', d => d3.color(scaleC(d[colorDomain.value])).darker(0.7))
    //     // .attr('display', d => checkCurrentYear(d.Year))
    //     .attr('opacity', d => checkSelectedCountry(d))

    circles.enter().append('circle')
      .attr('class', 'item')
      .attr('data-country', d => d.Country)
      .attr('data-iso', d => d.ISO)
      .attr('data-year', d => d.Year)
      .attr('r', d => scaleR(d[currentRadius]))
      .attr('cx', d => scaleX(d[currentX]))
      .attr('cy', d => scaleY(d[currentY]))
      .attr('fill', d => scaleC(d[colorDomain.value]))
      .attr('stroke', d => d3.color(scaleC(d[colorDomain.value])).darker(0.7))
      .attr('display', d => checkCurrentYear(d.Year))
      .attr('opacity', d => checkSelectedCountry(d))
      .on('mouseover', function (d) {
        let selectedItem = d3.select(this)
        mouseover(selectedItem, d)
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
        .transition()
          .duration(1000)
          .attr('data-year', d => d.Year)
          .attr('r', d => scaleR(d[currentRadius]))
          .attr('cx', d => scaleX(d[currentX]))
          .attr('cy', d => scaleY(d[currentY]))
          .attr('fill', d => scaleC(d[colorDomain.value]))
          .attr('stroke', d => d3.color(scaleC(d[colorDomain.value])).darker(0.7))
          .attr('display', d => checkCurrentYear(d.Year))
          .attr('opacity', d => checkSelectedCountry(d))

    circles.exit().remove()

    // Lines
    const lines = plot.selectAll('line.item').data(selectedCountries.countriesData, d => d['ISO-Year'])

    lines.attr('display', d => checkCurrentYear(d.Year))

    lines.enter().append('line')
      .attr('data-iso', d => d['ISO-Year'])
      .attr('class', 'item')
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('stroke-width', 1.5)
      .attr('x2', d => scaleX(d[currentX]))
      .attr('y2', d => scaleY(d[currentY]))
      .attr('x1', function (d, i) {
        if (i == 0) {
          return scaleX(d[currentX])
        } else {
          let prev = selectedCountries.countriesData[i - 1]
          return scaleX(prev[currentX])
        }
      })
      .attr('y1', function (d, i) {
        if (i == 0) {
          return scaleY(d[currentY])
        } else {
          let prev = selectedCountries.countriesData[i - 1]
          return scaleY(prev[currentY])
        }
      })

    lines.exit().remove()
  }

  function checkCurrentYear (dataYear) {
    if (dataYear > currentYear) {
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

    const axisLeft = d3.axisLeft(scaleY).tickSizeOuter(0).tickSizeInner(-width).ticks(3).tickFormat(d => formatAmount(d))
    const axisBottom = d3.axisBottom(scaleX)

    axisBottom.tickFormat(function (d) {
      return isMajorTick(d)
    })

    const x = axis.select('.axis--x')
    const maxY = scaleY.range()[0]
    const offset = maxY

    x.attr('transform', 'translate(0,' + height + ')')
      .call(axisBottom)

    x.selectAll('g').filter(function (d, i) {
      return isMajorTick(d)
    })
    .classed('major', true)

    x.select('.axis__label')
      .attr('x', width / 2)
      .attr('y', margin.bottom)
      .text(currentX)

    const y = axis.select('.axis--y')

    y.call(axisLeft)

    y.select('.axis__label')
      .attr('y', 0 - (margin.left / 2))
      .attr('x', 0 - (height / 2))
      .attr('text-anchor', 'middle')
      .attr('transform', `rotate(-90)`)
      .text(currentY)

    // Year
    const year = container.select('.g-year')
    year.attr('transform', 'translate(' + width + ', ' + height + ')')
    year.select('.chart-year')
      .attr('text-anchor', 'end')
      .transition()
        .duration(1000)
        .text(currentYear)
  }

  function isMajorTick (d) {
    if (Number.isInteger(d)) {
      return d
    }
  }

  function chart (container) {
    const data = container.datum()

    enter({ container, data })
    updateScales({ container, data })
    updateDom({ container, data })
    updateAxis({ container, data })
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

  chart.currentX = function (...args) {
    if (!args.length) return currentX
    currentX = args[0]
    return chart
  }

  chart.currentY = function (...args) {
    if (!args.length) return currentY
    currentY = args[0]
    return chart
  }

  chart.currentRadius = function (...args) {
    if (!args.length) return currentRadius
    currentRadius = args[0]
    return chart
  }

  chart.currentRanges = function (...args) {
    if (!args.length) return currentRanges
    currentRanges = args[0]
    return chart
  }

  chart.colorDomain = function (...args) {
    if (!args.length) return colorDomain
    colorDomain = args[0]
    return chart
  }

  chart.currentYear = function (...args) {
    if (!args.length) return currentYear
    currentYear = args[0]
    return chart
  }

  chart.selectedCountries = function (...args) {
    if (!args.length) return selectedCountries
    selectedCountries = args[0]
    return chart
  }

  return chart
}

function mouseover (item, d) {
  // Unselect previous item
  d3.selectAll('.item:not(.isActive)').style('fill', null).style('stroke-width', null).style('fill-opacity', '0.4')

  item.style('fill', function () {
    return d3.rgb(item.attr('fill')).brighter(0.75)
  })
  .style('stroke-width', 1.5)
  .style('fill-opacity', 1)
  showTooltip(d, item)
}

function mouseout (d) {
  if (!d3.select(this).classed('isActive')) {
    d3.selectAll('.item').style('fill-opacity', null)
    d3.select(this).style('fill', null).style('stroke-width', null).style('fill-opacity', null)
    hideTooltip()
  }
}

function showTooltip (d, item) {
  let xPos = d3.event.pageX
  let yPos = d3.event.pageY

  tooltip.transition()
    .duration(200)
    .style('opacity', 0.9)
  tooltip.html(`<p class="tooltip-heading">${d.Country} ${d.Year}</p>
    <p class="tooltip-body">
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
  chart.currentX(args.currentX)
  chart.currentY(args.currentY)
  chart.currentRadius(args.currentRadius)
  chart.currentRanges(args.currentRanges)
  chart.colorDomain(args.colorDomain)
  chart.currentYear(args.currentYear)
  chart.selectedCountries(args.selectedCountries)
  el.call(chart)
  resize()
}

export default { init, resize, mouseover, hideTooltip }
