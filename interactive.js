

// jquery accordion
$(() => {
  $('#accordion').accordion({
    heightStyle: 'fill',
  });
});

let data;
let xScale;
let yScale;
let xAxis;
let yAxis;
let radiusScale;

// wbScale will act as a color map
const wbScale = {
  1: '#deebf7', 2: '#c6dbef', 3: '#9ecae1', 4: '#6baed6', 5: '#3182bd', 6: '#08519c',
};

let countryList = new Set();
let label;

// defaults
let minYear; // earliest year in the dataset
let maxYear; // latest year in the dataset
let currentYear; // The year which we are currently visualizing
let currentX = 'Perceived Rule Of Law'; // hard coded
let currentY = 'Regulatory Quality'; // hard coded
let currentRadius = 'GNI per Capita, PPP(ci$)'; // hard coded

let width;
let height;

// call for csv data, execute function on callback
const q = d3.csv('data/GDF_iLab.csv', (result) => {
  
  maxYear = result.map(d=>Math.max(d.Year)).reduce((a,b)=>Math.max(a,b));
  minYear = result.map(d=>Math.max(d.Year)).reduce((a,b)=>Math.min(a,b));

  currentYear = minYear;

  // creating a set of countries 
  for (let i = 0; i < result.length; i++) {
    countryList.add(result[i].Country);
  }
  countryList = Array.from(countryList);

  // loop over to get keys for all categories, will be appended to dropdown buttons in the UI
  const categories = Object.keys(result[0]);
  for (let i = 0; i < categories.length; i++) {
    if (categories[i] != 'Country' && categories[i] != 'Year') {
      if (categories[i] == 'Perceived Rule Of Law') { // hard coded
        d3.select('#dropdownX').append('option').html(categories[i]).attr('class', 'defaultoption');
      } else {
        d3.select('#dropdownX').append('option').html(categories[i]);
      }
    }
  }

  for (let i = 0; i < categories.length; i++) {
    if (categories[i] != 'Country' && categories[i] != 'Year') {
      if (categories[i] == 'Regulatory Quality') { // hard coded
        d3.select('#dropdownY').append('option').html(categories[i]).attr('class', 'defaultoption');
      } else {
        d3.select('#dropdownY').append('option').html(categories[i]);
      }

    }
  }

  for (let i = 0; i < categories.length; i++) {
    if (categories[i] != 'Country' && categories[i] != 'Year') {
      if (categories[i] == 'GNI per Capita, PPP(ci$)') { // hard coded
        d3.select('#dropdownR').append('option').html(categories[i]).attr('class', 'defaultoption');
      } else {
        d3.select('#dropdownR').append('option').html(categories[i]);
      }
    }
  }

  const defaultoptions = document.getElementsByClassName('defaultoption');
  for (let i = 0; i < defaultoptions.length; i++) {
    defaultoptions[i].selected = true;
  }

  data = result;

  makeChart(); // the main chart
  makeBabyChart(); // chart that shows min,max circle sizes
});


// find out if data exists
function isEmpty(d, theScale, year) {
  return (d.filter(r => r.Year == year)[0][theScale] == '');
}

/* get data for a particular category 'theScale' in a particular year
if data doesn't exist, looks for the last known value. If last known value
doesn't exist, looks for first known value */
function getData(d, theScale, year) {
  if (d.filter(r => r.Year == year)[0][theScale] == '') {
    let yearIter = year - 1;
    while (yearIter >= minYear) {
      if (d.filter(r => r.Year == yearIter)[0][theScale] != '') {
        // console.log(this);
        return d.filter(r => r.Year == yearIter)[0][theScale];
      }
      yearIter -= 1;
    }

    yearIter = year + 1;
    while (yearIter <= maxYear) {
      if (d.filter(r => r.Year == yearIter)[0][theScale] != '') {
        return d.filter(r => r.Year == yearIter)[0][theScale];
      }
      yearIter += 1;
    }

    // all else fails (unlikely), just return the lower bound of domain
    return getDomain(theScale)[0];
  }
  return d.filter(r => r.Year == year)[0][theScale];
}

function getDomain(string) {
  return domainCalc(data.map(d => d[string]));
}

function domainCalc(data) {
  let max;
  let min;
  for (let i = 0; i < data.length; i++) {
    const parsedNumber = parseFloat(data[i]);
    if (!isNaN(parsedNumber)) {
      if (max === undefined) {
        max = parsedNumber;
        min = parsedNumber;
      }
      if (min > parsedNumber) {
        min = parsedNumber;
      }
      if (max < parsedNumber) {
        max = parsedNumber;
      }
    }
  }
  return [min, max];
}

/* this is a function that ensures all circles with a smaller radius
are placed on top of circles with a bigger radius */

function reorder() {
  const allPoints = document.getElementsByClassName('point');
  const pointsNode = document.getElementById('points');
  const new_pointsNode = pointsNode.cloneNode(false);

  let z = document.getElementsByClassName('point').length;
  while (z > 0) {
    const maxIndex = findMax(allPoints);
    const theNode = allPoints[maxIndex].cloneNode(true);
    new_pointsNode.append(theNode);
    d3.select(theNode).data(d3.select(allPoints[maxIndex]).data());
    allPoints[maxIndex].remove();
    z--;
  }
  document.getElementById('gRoot').appendChild(new_pointsNode);
  pointsNode.remove();
  attachListeners();
}

function findMax(arr) {
  let max = 0;
  for (let i = 0; i < arr.length; i++) {
    if (parseFloat(arr[i].getAttribute('r')) > parseFloat(arr[max].getAttribute('r'))) {
      max = i;

    }
  }
  return max;
}

function makeBabyChart() {

  d3.select('#circleLegendLabel').text(currentRadius);

  d3.select('#circleLegendGraph')
    .selectAll('circle')
    .remove();

  d3.selectAll('.circleLabel')
    .remove();


  const boundingClientRect = document.getElementById('circleLegendGraph').getBoundingClientRect();


  d3.select('#circleLegendGraph')
    .selectAll('circle')
    .data([getDomain(currentRadius)[1], getDomain(currentRadius)[0]])
    .enter()
    .append('circle')
    .attr('class', 'legendCircles')
    .attr('cx', boundingClientRect.width / 2)
    .attr('cy', boundingClientRect.height / 2)
    .attr('r', d => radiusScale(d))
    .style('fill', 'white');

  d3.selectAll('.legendCircles').select(function (d) {
    const boundingClientRect = this.getBoundingClientRect();

    d3.select('#circleLegendGraph')
      .append('text')
      .attr('x', parseFloat(this.getAttribute('cx')) + boundingClientRect.width / 2)
      .attr('y', parseFloat(this.getAttribute('cy')) + boundingClientRect.height / 2)
      .attr('class', 'circleLabel')
      .text(d);
  });
}

// triggered when x-dimension is changed
function changeXScale(newData) {
  currentX = newData;
  d3.select('#xLabel').text(newData);
  xScale.domain(getDomain(newData)).range([0, width]);
  d3.select('#xAxis').transition().duration(1500).ease(d3.easeQuadInOut)
    .call(xAxis);
  update(currentYear, false);
}

// triggered when y-dimension is changed
function changeYScale(newData) {
  currentY = newData;
  d3.select('#yLabel').text(newData);
  yScale.domain(getDomain(newData)).range([height, 0]);
  d3.select('#yAxis').transition().duration(1500).ease(d3.easeQuadInOut)
    .call(yAxis);
  update(currentYear, false);
}

// triggered when radius-dimension is changed
function changeRadius(newData) {
  currentRadius = newData;
  radiusScale.domain(getDomain(newData)).range([2, 40]);
  update(currentYear, false);
}

function makeChart() {
  d3.select('#theGraph').remove();
  d3.select('#tooltips').remove();

  const margin = {
    top: 19.5, right: 19.5, bottom: 49.5, left: 60,
  };
  width = document.getElementById('graph').clientWidth - margin.right;
  height = 500 - margin.top - margin.bottom;

  /* I anticipate a feature request to be the ability to switch from a linear to a log scale.
  this would probably require some tweaking to the code immidiately below */
  xScale = d3.scaleLinear().domain(getDomain(currentX)).range([0, width]);
  yScale = d3.scaleLinear().domain(getDomain(currentY)).range([height, 0]);
  radiusScale = d3.scaleSqrt().domain(getDomain(currentRadius)).range([2, 40]);

  xAxis = d3.axisBottom(xScale).ticks(12, d3.format(',d')).tickSizeOuter(0);
  yAxis = d3.axisLeft(yScale).tickSizeOuter(0);

  const tooltips = d3.select('#graph').append('div').attr('id', 'tooltips');

  const svg = d3.select('#graph').append('svg')
    .attr('id', 'theGraph')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  const svgRoot = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)
    .attr('id', 'gRoot');

  svgRoot.append('g')
    .attr('id', 'points')
    .selectAll('circle')
    .data(countryList.map(d => data.filter(r => r.Country === d)))
    .enter()
    .append('circle')
    .attr('id', d => d[0].Country.replace(/ /g, ''))
    .attr('class', 'point')
    .attr('cx', d => xScale(getData(d, currentX, currentYear)))
    .attr('cy', d => yScale(getData(d, currentY, currentYear)))
    .attr('r', d => radiusScale(getData(d, currentRadius, currentYear)))
    .style('fill', (d) => {
    // if any data is missing return red or else return the correct world-bank classification code
      if (isEmpty(d, currentX, currentYear) || isEmpty(d, currentY, currentYear) || isEmpty(d, currentRadius, currentYear)) {
        return 'red';
      }
      return wbScale[d.filter(r => r.Year == currentYear)[0]['World Bank Classification']]; // hard coded
    });

  d3.selectAll('.point').select(function (d) {
    const boundingClientRect = this.getBoundingClientRect();
    const theTooltip = d3.select('#tooltips')
      .append('div')
      .attr('class', 'tooltip')
      .attr('id', `${d[0].Country.replace(/ /g, '')}tooltip`)
      .style('top', boundingClientRect.top + boundingClientRect.height)
      .style('left', boundingClientRect.left + boundingClientRect.width);


    theTooltip.append('div')
      .attr('id', `${d[0].Country.replace(/ /g, '')}tooltipcaption`)
      .attr('class', 'tooltipcaption')
      .text(d[0].Country);

    theTooltip.append('div')
      .attr('class', 'tooltipdetail')
      .attr('id', `${d[0].Country.replace(/ /g, '')}tooltipX`)
      .text(`${currentX}: ${isEmpty(d, currentX, currentYear) ? 'No Data' : getData(d, currentX, currentYear)}`);

    theTooltip.append('div')
      .attr('class', 'tooltipdetail')
      .attr('id', `${d[0].Country.replace(/ /g, '')}tooltipY`)
      .text(`${currentY}: ${getData(d, currentY, currentYear)}`);

    theTooltip.append('div')
      .attr('class', 'tooltipdetail')
      .attr('id', `${d[0].Country.replace(/ /g, '')}tooltipRadius`)
      .text(`${currentRadius}: ${getData(d, currentRadius, currentYear)}`);
  });

  const labelRoot = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)
    .attr('id', 'labelRoot');

  labelRoot.append('g')
    .attr('id', 'xAxis')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis);

  labelRoot.append('g')
    .attr('id', 'yAxis')
    .call(yAxis);

  // Add an x-axis label.
  svgRoot.append('text')
    .attr('id', 'xLabel')
    .attr('text-anchor', 'end')
    .attr('x', width)
    .attr('y', height - 6)
    .text(currentX);

  // Add a y-axis label.
  svgRoot.append('text')
    .attr('id', 'yLabel')
    .attr('text-anchor', 'end')
    .attr('y', 6)
    .attr('dy', '.75em')
    .attr('transform', 'rotate(-90)')
    .text(currentY);

  // Add the year label; the value is set on transition.
  label = svgRoot.append('text')
    .attr('class', 'year label')
    .attr('text-anchor', 'end')
    .attr('y', height - 24)
    .attr('x', width)
    .text(minYear);

  reorder();
}

function attachListeners() {
  /* Attach hover events to the circles. Different behavior is attached
  depending on whether or not the checkbox is selected */
  d3.selectAll('.checkboxes').select(function () {
    if (this.checked) {
      d3.select(`#${this.getAttribute('country')}`)
        .on('mouseenter', function (d) {
          d3.select(`#legend${d[4].Country}`).style('border', '2px solid #E8336D');
          d3.select(this).style('stroke', '#E8336D');
          d3.select(this).style('stroke-width', '3px');

          const boundingClientRect = document.getElementById('circleLegendGraph').getBoundingClientRect();

          d3.select('#circleLegendGraph')
            .append('circle')
            .attr('id', 'tempCirc')
            .attr('cx', boundingClientRect.width / 2)
            .attr('cy', boundingClientRect.height / 2)
            .attr('r', this.getAttribute('r'))
            .style('fill', 'white')
            .style('stroke', '#E8336D');

          const currentGNI = d[3][currentYear];

          d3.select('#circleLegendGraph')
            .append('text')
            .attr('x', parseFloat(this.getAttribute('r')) / 2 + boundingClientRect.width / 2)
            .attr('y', parseFloat(this.getAttribute('r')) / 2 + boundingClientRect.height / 2)
            .attr('id', 'tempLabel')
            .text(currentGNI);

          d3.selectAll('.circleLabel')
            .style('opacity', 0.3);
        })
        .on('mouseleave', function (d) {
          d3.select(this).style('stroke', 'black');
          d3.select(this).style('stroke-width', '1px');
          d3.select('#tempCirc').remove();
          d3.select('#tempLabel').remove();
          d3.selectAll('.circleLabel')
            .style('opacity', 1);
        });
    } else {
      d3.select(`#${this.getAttribute('country')}`)
        .on('mouseenter', function (d) {
          d3.select(`#${this.id}tooltipX`).style('display', 'block');
          d3.select(`#${this.id}tooltipY`).style('display', 'block');
          d3.select(`#${this.id}tooltipRadius`).style('display', 'block');

          d3.select(`#${this.id}tooltip`)
            .style('display', 'block');

          d3.select(`#legend${d[0].Country}`).style('border', '2px solid #E8336D');
          d3.select(this).style('stroke', '#E8336D');
          d3.select(this).style('stroke-width', '3px');

          const boundingClientRect = document.getElementById('circleLegendGraph').getBoundingClientRect();

          d3.select('#circleLegendGraph')
            .append('circle')
            .attr('id', 'tempCirc')
            .attr('cx', boundingClientRect.width / 2)
            .attr('cy', boundingClientRect.height / 2)
            .attr('r', this.getAttribute('r'))
            .style('fill', 'white')
            .style('stroke', '#E8336D');

          const tempRadLabel = getData(d, currentRadius, currentYear);

          d3.select('#circleLegendGraph')
            .append('text')
            .attr('x', parseFloat(this.getAttribute('r')) / 2 + boundingClientRect.width / 2)
            .attr('y', parseFloat(this.getAttribute('r')) / 2 + boundingClientRect.height / 1.6)
            .attr('id', 'tempLabel')
            .text(tempRadLabel);

          d3.selectAll('.circleLabel')
            .style('opacity', 0.3);
        })
        .on('mouseleave', function (d) {
          d3.select(`#${this.id}tooltipX`).style('display', 'none');
          d3.select(`#${this.id}tooltipY`).style('display', 'none');
          d3.select(`#${this.id}tooltipRadius`).style('display', 'none');

          d3.select(`#${this.getAttribute('id')}tooltip`)
            .style('display', 'none');

          d3.select(`#legend${d[0].Country}`).style('border', null);
          d3.select(this).style('stroke', 'black');
          d3.select(this).style('stroke-width', '1px');

          d3.select('#tempCirc').remove();
          d3.select('#tempLabel').remove();
          d3.selectAll('.circleLabel')
            .style('opacity', 1);
        });
    }
  });
}

function yearChange(year) {
  update(parseInt(year), false);
}

function update(year, playButton) {
  const t = d3.transition()
    .duration(1000)
    .ease(d3.easeQuadInOut)
    .on('end', () => {
      if (year < maxYear && playButton) {
        attachListeners();
        update(year + 1, playButton);
      } else {
        reorder();
      }
    });

  d3.selectAll('.point')
    .attr('cx', d => xScale(getData(d, currentX, year)))
    .attr('cy', d => yScale(getData(d, currentY, year)))
    .attr('r', d => radiusScale(getData(d, currentRadius, year)));

  d3.selectAll('.point')
    .select(function (d) {
      const boundingClientRect = this.getBoundingClientRect();

      d3.select(`#${d[0].Country.replace(/ /g, '')}tooltip`)
        .transition(t)
        .style('top', boundingClientRect.bottom)
        .style('left', boundingClientRect.right);
    });

  d3.selectAll('.point')
    .attr('cx', d => xScale(getData(d, currentX, currentYear)))
    .attr('cy', d => yScale(getData(d, currentY, currentYear)))
    .attr('r', d => radiusScale(getData(d, currentRadius, currentYear)))
    .style('fill', (d) => {
      if (isEmpty(d, currentX, year) || isEmpty(d, currentY, year) || isEmpty(d, currentRadius, year)) {
        return 'red';
      }
      return wbScale[d.filter(r => r.Year == year)[0]['World Bank Classification']]; // hard coded
    });

  d3.selectAll('.point')
    .transition(t)
    .attr('cx', d => xScale(getData(d, currentX, year)))
    .attr('cy', d => yScale(getData(d, currentY, year)))
    .attr('r', d => radiusScale(getData(d, currentRadius, year)));

  d3.selectAll('.point').select((d) => {
    d3.select(`#${d[0].Country.replace(/ /g, '')}tooltipX`)
      .text(`${currentX}: ${isEmpty(d, currentX, year) ? 'No Data' : getData(d, currentX, year)}`);

    d3.select(`#${d[0].Country.replace(/ /g, '')}tooltipY`)
      .text(`${currentY}: ${isEmpty(d, currentY, year) ? 'No Data' : getData(d, currentY, year)}`);


    d3.select(`#${d[0].Country.replace(/ /g, '')}tooltipRadius`)
      .text(`${currentRadius}: ${isEmpty(d, currentRadius, year) ? 'No Data' : getData(d, currentRadius, year)}`);
  });

  document.getElementById('slider').value = parseInt(year);
  currentYear = parseInt(document.getElementById('slider').value);
  label.text(year);
  makeBabyChart(); // update the radius-legend chart
}



function play() {
  // if the play button is triggered when current year is 2015, wrap around to 1995
  if (parseInt(document.getElementById('slider').value) == maxYear) {
    update(minYear, true);
  } else {
    // else call update on the next year
    update(parseInt(document.getElementById('slider').value) + 1, true);
  }
}

// jquery accordion checkbox change
function checkboxChange() {
  let anyCheckBoxOn = false;
  d3.selectAll('.checkboxes').select(function () {
    if (this.checked) { anyCheckBoxOn = true; }
  });
  if (anyCheckBoxOn) {
    d3.selectAll('.checkboxes').select(function () {
      if (this.checked) {
        d3.select(`#${this.getAttribute('country')}`).style('opacity', '1');
        d3.select(`#${this.getAttribute('country')}tooltip`).style('display', 'block');
      } else {
        d3.select(`#${this.getAttribute('country')}`).style('opacity', '0.3');
        d3.select(`#${this.getAttribute('country')}tooltip`).style('display', 'none');
      }
    });
  } else {
    d3.selectAll('.checkboxes').select(function () {
      d3.select(`#${this.getAttribute('country')}`).style('opacity', '1');
      d3.select(`#${this.getAttribute('country')}tooltip`).style('display', 'none');
    });
  }
  attachListeners();
}

window.onresize = resizefunc;

function resizefunc() {

  makeChart();
  makeBabyChart();
}

