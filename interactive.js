  // jquery accordion
  $(() => {
      $('#accordion').accordion({
          heightStyle: 'fill',
      });
  });

  $(".hamburger").click(function() {
      $("#containerTopRight").toggleClass("active");

      if ($('#containerTopRight').hasClass("active")) {
          $('.optionsText').html("CLOSE");

      } else {
          $('.optionsText').html("OPTIONS");
      }
  });

  function shadeColor(color, percent) {
      var f = parseInt(color.slice(1), 16),
          t = percent < 0 ? 0 : 255,
          p = percent < 0 ? percent * -1 : percent,
          R = f >> 16,
          G = f >> 8 & 0x00FF,
          B = f & 0x0000FF;
      return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
  };



  $("#dropdownY").selectmenu({
      change: function(event, ui) {
          changeYScale(this.value)
      }
  }).addClass("overflow");

  $("#dropdownX").selectmenu({
      change: function(event, ui) {
          changeXScale(this.value)

      }
  });
  $("#dropdownR").selectmenu({
      change: function(event, ui) {
          changeRadius(this.value)
      }
  });



  $("#slider").slider({
      min: 1995,
      max: 2015,
      create: function(event, ui) {

      },
      slide: function(event, ui) {
          yearChange(ui.value);
          $(".year.label").text(ui.value);
          pause(ui.value);
          var tooltip = '<div class="date-tooltip">' + ui.value + '</div>';
          $('.ui-slider-handle').html(tooltip); //attach tooltip to the slider handle
          removeOldTrail(ui.value);

      },
      change: function(event, ui) {
          $('.ui-slider-handle').html(); //attach tooltip to the slider handle

      },
      stop: function(event, ui) {
          $('.ui-slider-handle').html('<div class="date-tooltip"></div>');
      }
  });


  let data;
  let xScale;
  let yScale;
  let xAxis;
  let yAxis;
  let radiusScale;

  // wbScale will act as a color map
  const wbScale = {
      1: '#deebf7',
      2: '#c6dbef',
      3: '#9ecae1',
      4: '#6baed6',
      5: '#3182bd',
      6: '#08519c',
  };

  var noColor = '#d3d3d3';
  var marginTop = 19.5;
  var marginRight = 0;
  var marginBottom = 70;
  var marginLeft = 100;


  let countryList = new Set();
  let label;


  let lineColor = "blue";
  let lineHover = "red";
  let trailColor = "green"

  // defaults
  let minYear; // earliest year in the dataset
  let maxYear; // latest year in the dataset
  let currentYear; // The year which we are currently visualizing
  let currentX = 'Perceived Rule Of Law'; // hard coded
  let currentY = 'Regulatory Quality'; // hard coded
  let currentRadius = 'GNI per Capita, PPP(ci$)'; // hard coded

  let width;
  let height;

  let screenwidth = $(window).width();



  if (screenwidth <= 768) {


  } else {

  }

  $(window).resize(function() {

      if (screenwidth <= 768) {

      } else {

      }

  });

  function resizefunc() {
      makeChart();
      makeBabyChart();
  }



  // call for csv data, execute function on callback
  const q = d3.csv('data/GDF_iLab.csv', (result) => {

      maxYear = result.map(d => Math.max(d.Year)).reduce((a, b) => Math.max(a, b));
      minYear = result.map(d => Math.max(d.Year)).reduce((a, b) => Math.min(a, b));

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
                  d3.select('#dropdownX').append('option').html(categories[i]);

              } else {
                  d3.select('#dropdownX').append('option').html(categories[i]);
              }

          }
      }

      $('#dropdownX').val('Perceived Rule Of Law');
      $('#dropdownX').selectmenu("refresh");

      for (let i = 0; i < categories.length; i++) {
          if (categories[i] != 'Country' && categories[i] != 'Year') {
              if (categories[i] == 'Regulatory Quality') { // hard coded
                  d3.select('#dropdownY').append('option').html(categories[i]).attr('selected', 'selected');

              } else {
                  d3.select('#dropdownY').append('option').html(categories[i]);
              }

          }
      }
      $('#dropdownY').val('Regulatory Quality');
      $('#dropdownY').selectmenu("refresh");

      for (let i = 0; i < categories.length; i++) {
          if (categories[i] != 'Country' && categories[i] != 'Year') {
              if (categories[i] == 'GNI per Capita, PPP(ci$)') { // hard coded
                  d3.select('#dropdownR').append('option').html(categories[i]).attr('selected', 'selected');

              } else {
                  d3.select('#dropdownR').append('option').html(categories[i]);
              }
          }
      }
      $('#dropdownR').val('GNI per Capita, PPP(ci$)');
      $('#dropdownR').selectmenu("refresh");

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
          var siblingNode = getSiblings(theNode);
          if (siblingNode.length > 0 | siblingNode.length != '') {

              const siblingClone = siblingNode[0].cloneNode(true);
              new_pointsNode.append(siblingClone);
          }
          new_pointsNode.append(theNode);



          d3.select(theNode).data(d3.select(allPoints[maxIndex]).data());
          allPoints[maxIndex].remove();


          z--;
      }
      document.getElementById('gRoot').appendChild(new_pointsNode);
      pointsNode.remove();
      attachListeners();
  }


  function getSiblings(theNode) {

      var nodeName = theNode.getAttributeNode("id").value;
      var sibling = document.getElementsByName(nodeName);
      if (sibling.length > 0 | sibling.length != 'undefined') {
          return sibling;
      }
  };


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

      d3.selectAll('.legendCircles').select(function(d) {
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
      //$div2blink.toggleClass("backgroundRed");
      currentX = newData;
      d3.select('#xLabel').text(newData);
      xScale.domain(getDomain(newData)).range([0, width]);
      d3.select('#xAxis').transition().duration(1500).ease(d3.easeQuadInOut)
          .call(xAxis);
      update(currentYear, false);

      var $div2blink = $("#xLabel");
      //$div2blink.toggleClass("backgroundRed");
      $div2blink.animate({
          fontSize: "19",
          opacity: '.5'
      }, 200);
      $div2blink.animate({
          fontSize: "18",
          opacity: '1'
      }, 200);

  }

  // triggered when y-dimension is changed
  function changeYScale(newData) {
      currentY = newData;
      d3.select('#yLabel').text(newData);
      yScale.domain(getDomain(newData)).range([height, 0]);
      d3.select('#yAxis').transition().duration(1500).ease(d3.easeQuadInOut)
          .call(yAxis);
      update(currentYear, false);

      var $div2blink = $("#yLabel");
      //$div2blink.toggleClass("backgroundRed");
      $div2blink.animate({
          fontSize: "19",
          opacity: '.5'
      }, 200);
      $div2blink.animate({
          fontSize: "18",
          opacity: '1'
      }, 200);



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

      if (screenwidth <= 768) {
          var margin = {
              top: marginTop * 2,
              right: marginRight,
              bottom: marginBottom,
              left: 20,
          };

          width = document.getElementById('graph').clientWidth - margin.right;
          height = 500 - margin.top - margin.bottom;

      } else {

          var margin = {
              top: marginTop,
              right: marginRight,
              bottom: marginBottom,
              left: marginLeft,
          };
          width = document.getElementById('graph').clientWidth - margin.right - margin.left;
          height = 500 - margin.top - margin.bottom;


      };

      /* I anticipate a feature request to be the ability to switch from a linear to a log scale.
      this would probably require some tweaking to the code immidiately below */
      xScale = d3.scaleLinear().domain(getDomain(currentX)).range([0, width]);
      yScale = d3.scaleLinear().domain(getDomain(currentY)).range([height, 0]);
      radiusScale = d3.scaleSqrt().domain(getDomain(currentRadius)).range([2, 40]);

      xAxis = d3.axisBottom(xScale).ticks(12, d3.format(',d')).tickSizeOuter(0);
      yAxis = d3.axisLeft(yScale).tickSizeOuter(0).tickSizeInner(-width);



      const tooltips = d3.select('#graph').append('div').attr('id', 'tooltips');

      const svg = d3.select('#graph').append('svg')
          .attr('id', 'theGraph')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom);

      const labelRoot = svg.append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`)
          .attr('id', 'labelRoot');

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
                  return noColor;
              }
              return wbScale[d.filter(r => r.Year == currentYear)[0]['World Bank Classification']]; // hard coded
          })
          .style('stroke', (d) => {
              if (isEmpty(d, currentX, currentYear) || isEmpty(d, currentY, currentYear) || isEmpty(d, currentRadius, currentYear)) {
                  var dark = shadeColor(noColor, -0.3);
                  return dark;
              }
              var blue = wbScale[d.filter(r => r.Year == currentYear)[0]['World Bank Classification']];
              var darkblue = shadeColor(blue, -0.3);
              //console.log(darkblue);
              return darkblue;
          });


      d3.selectAll('.point').select(function(d) {
          const boundingClientRect = this.getBoundingClientRect();
          var element = d3.select('#graph').node();
          var boxY = element.getBoundingClientRect().y;
          var boxH = element.getBoundingClientRect().height;

          // Add a y-axis label.
          if (screenwidth <= 768) {
              var theTooltip = d3.select('#tooltips')
                  .append('div')
                  .attr('class', 'tooltip')
                  .attr('id', `${d[0].Country.replace(/ /g, '')}tooltip`)
                  .style('top', boxY + boxH)
                  .style('left', 0 + margin.left);

          } else {
              var theTooltip = d3.select('#tooltips')
                  .append('div')
                  .attr('class', 'tooltip')
                  .attr('id', `${d[0].Country.replace(/ /g, '')}tooltip`)
                  .style('top', boundingClientRect.top + boundingClientRect.height)
                  .style('left', boundingClientRect.left + boundingClientRect.width);
          };






          theTooltip.append('div')
              .attr('id', `${d[0].Country.replace(/ /g, '')}tooltipcaption`)
              .attr('class', 'tooltipcaption')
              .text(d[0].Country);

          theTooltip.append('div')
              .attr('class', 'tooltipdetail')
              .attr('id', `${d[0].Country.replace(/ /g, '')}tooltipX`)
              .html('<span class="no-data">' + `${currentX}: ${isEmpty(d, currentX, currentYear) ? 'No Data</span>' : getData(d, currentX, currentYear)}`);

          theTooltip.append('div')
              .attr('class', 'tooltipdetail')
              .attr('id', `${d[0].Country.replace(/ /g, '')}tooltipY`)
              .text(`${currentY}: ${getData(d, currentY, currentYear)}`);

          theTooltip.append('div')
              .attr('class', 'tooltipdetail')
              .attr('id', `${d[0].Country.replace(/ /g, '')}tooltipRadius`)
              .text(`${currentRadius}: ${getData(d, currentRadius, currentYear)}`);
      });




      labelRoot.append('g')
          .attr('id', 'xAxis')
          .attr('transform', `translate(0,${height})`)

          .call(xAxis);

      labelRoot.append('g')
          .attr('id', 'yAxis')
          .attr('class', 'gridtick')

          .call(yAxis);


      // Add a y-axis label.



      labelRoot.append('text')
          .attr('id', 'yLabel')
          .attr('text-anchor', 'middle')
          .attr('y', margin.top * -4)
          .attr('x', height / -2)
          .attr('dy', 20)
          .attr('transform', 'rotate(-90)')
          .text(currentY);





      // Add the year label; the value is set on transition.
      label = svgRoot.append('text')
          .attr('class', 'year label')
          .attr('text-anchor', 'end')
          .attr('y', height - 30)
          .attr('x', width)
          .text(minYear);


      svgRoot.append('text')
          .attr('id', '#circleLegendLabel')

          .attr('text-anchor', 'end')
          .attr('y', height - 10)
          .attr('x', width)
          .text(currentRadius);




      labelRoot.append('rect')
          .attr('id', 'y-container')
          .style('fill', 'white')
          .style('opacity', '.8')
          .style('display', 'none')

      labelRoot.append('rect')
          .attr('id', 'x-container')
          .style('fill', 'white')
          .style('opacity', '.8')
          .style('display', 'none')




      labelRoot.append('text')
          .attr('id', 'y-data')
          .style('font-size', '125%')
          .style('display', 'none');

      labelRoot.append('text')
          .attr('id', 'x-data')
          .style('font-size', '125%')

          .style('display', 'none');

      reorder();

      labelRoot.append('line')
          .attr('id', 'hover-line-x')
          .attr('x1', 0)
          .attr('x2', 0)
          .attr('y1', 0)
          .attr('y2', 0)
          .style('stroke', 'black')
          .style('display', 'none');

      labelRoot.append('line')
          .attr('id', 'hover-line-y')
          .attr('x1', 0)
          .attr('x2', 0)
          .attr('y1', 0)
          .attr('y2', 0)
          .style('stroke', 'black')
          .style('display', 'none');


  }

  function makeTrail(countryName) {

      d3.selectAll('#points').insert('g', `#${countryName}`)
          .attr('id', `${countryName}-trails`)
          .attr('class', 'trails')
          .style('visibility', 'visible').attr('name', countryName);

      d3.select(`#${countryName}-trails`).select(function(d) {

          var count = maxYear - minYear;

          for (i = 0; i < count; i++) {
              var thisYear = minYear + i;

              d3.select(this).append('line').attr('data-year', thisYear);
          }

          for (i = 0; i < count; i++) {
              var thisYear = minYear + i;


              d3.select(this).append('circle')
                  .attr('data-year', thisYear);

          }
          for (i = 0; i < count; i++) {
              var thisYear = minYear + i;


              d3.select(this).append('tooltipYear')
                  .attr('data-year', thisYear);

          }

      });


  }

  function removeTrail(countryName) {
      d3.select(`#${countryName}-trails`).remove();
  }

  function attachListeners() {
      /* Attach hover events to the circles. Different behavior is attached
      depending on whether or not the checkbox is selected */

      d3.selectAll('.point').select(function() {
          d3.select(`#${this.getAttribute('id')}`)
              .on('click', click);
      });

      d3.selectAll('.checkboxes').select(function() {
          var countryID = d3.select(`#${this.getAttribute('country')}`).attr('id');
          if (this.checked) {
              ifChecked(countryID)
              //console.log(strokeColor);
          } else {
              //ifUnchecked(countryID)
          };
      });

      d3.selectAll('.tooltipYear').select(function() {

              d3.select()
              d3.select(`#${countryID}-trails .tooltipYear[data-year='${year}']`)
                  .style('display', 'block');
          })
          .on('mouseenter', function(d) {
              (`#${countryID}tooltipX`).style('display', 'none');
          });


      d3.selectAll('.tooltipYear').select(function() {
          d3.select(this).select('circle')
              .on('mouseenter', function(d) {
                  var year = d3.select(this).attr('data-year');
                  var countryID = d3.select(this).attr('id');
                  d3.select(`#${countryID}-trails .tooltipYear[data-year='${year}']`)
                      .style('display', 'block');

              });
      });

  }


  function click(d, i) {
      var countryID = d3.select(this).attr('id');
      //console.log(countryID + ": " + currentYear);
      pause(currentYear);

      $("#accordion input[type=checkbox][country=" + countryID + "]").prop("checked", function(i, val) {
          return !val;
      });

      checkboxChange();

      d3.selectAll('.checkboxes').select(function() {
          ifChecked(countryID);
      });
  }


  function ifChecked(countryID) {

      var strokeColor = d3.select(`#${countryID}`).style('stroke');
      d3.select(`#${countryID}tooltipX`).style('display', 'none');
      d3.select(`#${countryID}tooltipY`).style('display', 'none');
      d3.select(`#${countryID}tooltipRadius`).style('display', 'none');


      d3.select(`#${countryID}`)

          .on('mouseenter', function(d) {

              d3.select(`#legend${countryID}`).style('border', '2px solid #E8336D');
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

              var circleX1 = d3.select(this).attr('cx');
              var circleY = d3.select(this).attr('cy');
              var circleX = circleX1 + marginLeft;


              d3.select('#hover-line-x')
                  .attr('x1', circleX)
                  .attr('x2', 0)
                  .attr('y1', circleY)
                  .attr('y2', circleY)
                  .style("stroke-dasharray", ("4, 4"))
                  .style('display', 'block');


              d3.select('#hover-line-y')

                  .attr('x1', circleX)
                  .attr('x2', circleX)
                  .attr('y1', circleY)
                  .attr('y2', height)
                  .style("stroke-dasharray", ("4, 4"))
                  .style('display', 'block')



              d3.select('#x-data')
                  .attr("x", circleX)
                  .attr('class', 'data-hover')
                  .attr("y", height + 25)
                  .style('display', 'block')
                  .attr('text-anchor', 'middle')
                  .text(`${isEmpty(d, currentX, currentYear) ? 'N/A' : getData(d, currentX, currentYear)}`);

              //if (isEmpty(d, currentY, currentYear) == true) {
              //    console.log('empty')
              //}


              d3.select('#y-data')
                  .attr("x", 0 - 10)
                  .attr('class', 'data-hover')
                  .attr("y", circleY)
                  .style('display', 'block')
                  .attr('text-anchor', 'end')
                  .text(`${isEmpty(d, currentY, currentYear) ? 'N/A' : getData(d, currentY, currentYear)}`);


              var widthy = d3.select('#y-data').node().getBBox().width;
              var heighty = d3.select('#y-data').node().getBBox().height;
              var xy = d3.select('#y-data').node().getBBox().x;
              var yy = d3.select('#y-data').node().getBBox().y;

              d3.select('#y-container')
                  .style('display', 'block')
                  .attr("x", xy - 5)
                  .attr("y", yy)
                  .attr("height", heighty + 5)
                  .attr("width", widthy + 10);

              var widthx = d3.select('#x-data').node().getBBox().width;
              var heightx = d3.select('#x-data').node().getBBox().height;
              var xx = d3.select('#x-data').node().getBBox().x;
              var xy = d3.select('#x-data').node().getBBox().y;

              d3.select('#x-container')
                  .style('display', 'block')
                  .attr("x", xx - 5)
                  .attr("y", xy)
                  .attr("height", heightx + 5)
                  .attr("width", widthx + 10);

              d3.select(`#${countryID}-line`)
                  .style("stroke", lineHover);
          })



          .on('mouseleave', function(d) {
              d3.select(this).style('stroke', strokeColor);
              d3.select(this).style('stroke-width', '1px');
              d3.select('#tempCirc').remove();
              d3.select('#tempLabel').remove();
              d3.selectAll('.circleLabel')
                  .style('opacity', 1);


              d3.select('#hover-line-x')
                  .style('display', 'none');
              d3.select('#hover-line-y')
                  .style('display', 'none');

              d3.select('#x-data')
                  .style('display', 'none')

              d3.select('#y-data')
                  .style('display', 'none');

              d3.select('#x-container')
                  .style('display', 'none');

              d3.select('#y-container')
                  .style('display', 'none');
              d3.select(`#${countryID}-line`)
                  .style("stroke", lineColor);
          });
  }

  function ifUnchecked(countryID) {
      var strokeColor = d3.select(`#${countryID}`).style('stroke');
      //var country = d3.select(this).attr("country");
      //console.log(strokeColor);

      d3.select(`#${countryID}`)
          .on('mouseenter', function(d) {
              d3.select(`#${countryID}tooltipX`).style('display', 'block');
              d3.select(`#${countryID}tooltipY`).style('display', 'block');
              d3.select(`#${countryID}tooltipRadius`).style('display', 'block');

              d3.select(`#${countryID}tooltip`)
                  .style('display', 'block');

              d3.select(`#legend${countryID}`).style('border', '2px solid #E8336D');
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

              //alert(tempRadLabel);

              d3.selectAll('.circleLabel')
                  .style('opacity', 0.3);
          })

          .on('mouseleave', function(d) {
              d3.select(`#${countryID}tooltipX`).style('display', 'none');
              d3.select(`#${countryID}tooltipY`).style('display', 'none');
              d3.select(`#${countryID}tooltipRadius`).style('display', 'none');

              d3.select(`#${countryID}tooltip`)
                  .style('display', 'none');

              d3.select(`#legend${d[0].Country}`).style('border', null);
              d3.select(this).style('stroke', strokeColor);
              d3.select(this).style('stroke-width', '1px');

              d3.select('#tempCirc').remove();
              d3.select('#tempLabel').remove();
              d3.selectAll('.circleLabel')
                  .style('opacity', 1);
          });



  };


  function yearChange(year) {
      update(parseInt(year), false);

      var anyCheckBoxOn = false;
      d3.selectAll('.checkboxes').select(function() {
          if (this.checked) { anyCheckBoxOn = true; }
      });
      if (anyCheckBoxOn) {
          createTrail(year, 0);
          pointCopy(year, 0);
      }

  }

  function update(year, playButton) {

      var anyCheckBoxOn = false;
      d3.selectAll('.checkboxes').select(function() {
          if (this.checked) { anyCheckBoxOn = true; }
      });

      if (playButton === true) {
          var duration = 1000;
      } else if (playButton === false) {
          var duration = 0;
      }
      //console.log(playButton);
      const t = d3.transition()
          .duration(duration)
          .delay(0)
          .ease(d3.easeQuadInOut)
          .on('start', () => {

          })

          .on('end', () => {
              var newdate = year + 1;
              if (year < maxYear) {
                  if (anyCheckBoxOn) {
                      createTrail(year, duration);
                      pointCopy(newdate, duration);
                  }
              }
              if (year < maxYear && playButton) {
                  attachListeners();

                  $("#slider").slider("option", "value", newdate);
                  update(newdate, playButton);
                  $('#year-output').html(newdate);

              } else if (year == maxYear && playButton) {

                  pause(year);
                  reorder();

              } else {
                  reorder();
              }
          });


      d3.selectAll('.point')
          .select(function(d) {
              const boundingClientRect = this.getBoundingClientRect();

              d3.select(`#${d[0].Country.replace(/ /g, '')}tooltip`)
                  .transition(t)
                  .style('top', boundingClientRect.bottom)
                  .style('left', boundingClientRect.right);
          });

      d3.selectAll('.point')
          .transition(t)
          .attr('cx', d => xScale(getData(d, currentX, currentYear)))
          .attr('cy', d => yScale(getData(d, currentY, currentYear)))
          .attr('r', d => radiusScale(getData(d, currentRadius, currentYear)))
          .style('fill', (d) => {
              if (isEmpty(d, currentX, currentYear) || isEmpty(d, currentY, currentYear) || isEmpty(d, currentRadius, currentYear)) {
                  var dark = shadeColor(noColor, -0.3);
                  return dark;
              }
              var blue = wbScale[d.filter(r => r.Year == currentYear)[0]['World Bank Classification']];

              var darkblue = shadeColor(blue, -0.3);
              //console.log(darkblue);
              return darkblue;
          })
          .style('stroke', (d) => {
              if (isEmpty(d, currentX, currentYear) || isEmpty(d, currentY, currentYear) || isEmpty(d, currentRadius, currentYear)) {
                  var dark = shadeColor(noColor, -0.3);
                  return dark;
              }
              var blue = wbScale[d.filter(r => r.Year == currentYear)[0]['World Bank Classification']];

              var darkblue = shadeColor(blue, -0.3);
              //console.log(darkblue);
              return darkblue;

          });




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

  };


  function pointCopy(year, duration) {

      d3.selectAll('.trails').select(function(d) {


          var countryID = d3.select(this).attr('name');
          var thisData = d3.select(`#${countryID}`).datum();

          var circleX1 = calcTrailX(year, thisData);
          var circleY1 = calcTrailY(year, thisData);
          var circleR1 = calcTrailR(year, thisData);
          var fillColor1 = calcTrailFill(year, thisData);
          var strokeColor1 = calcTrailStroke(year, thisData);

          tooltipYear(year, countryID, circleX1, circleY1);

          d3.selectAll(`#${countryID}-trails circle[data-year='${year}']`)
              .transition()
              .duration(0)
              .delay(duration * 2)
              .ease(d3.easeQuadInOut)
              .attr('cx', circleX1)
              .attr('cy', circleY1)
              .attr('r', circleR1)
              .style('fill', fillColor1)
              .style('stroke', strokeColor1);

      });

  }

  function calcTrailX(year, thisData) {
      var circleX = xScale(getData(thisData, currentX, year));
      return circleX;
  }

  function calcTrailY(year, thisData) {
      var circleY = yScale(getData(thisData, currentY, year));
      return circleY;
  }

  function calcTrailR(year, thisData) {
      var circleR = radiusScale(getData(thisData, currentRadius, year));
      return circleR;
  }

  function calcTrailFill(year, thisData) {

      if (isEmpty(thisData, currentX, year) || isEmpty(thisData, currentY, year) || isEmpty(thisData, currentRadius, year)) {
          var dark = shadeColor(noColor, -0.3);
          return dark;
      }
      return wbScale[thisData.filter(r => r.Year == year)[0]['World Bank Classification']]; // hard coded

  }

  function calcTrailStroke(year, thisData) {

      if (isEmpty(thisData, currentX, year) || isEmpty(thisData, currentY, year) || isEmpty(thisData, currentRadius, year)) {
          var dark = shadeColor(noColor, -0.3);
          return dark;
      }
      var blue = wbScale[thisData.filter(r => r.Year == year)[0]['World Bank Classification']];

      var darkblue = shadeColor(blue, -0.3);
      //console.log(darkblue);
      return darkblue;


  }

  function createTrail(year, duration) {

      d3.selectAll('.trails').select(function(d) {

          var countryID = d3.select(this).attr('name');
          var thisData = d3.select(`#${countryID}`).datum();

          var lineX1 = calcTrailX(year, thisData);
          var lineY1 = calcTrailY(year, thisData);
          var fillColor1 = calcTrailFill(year, thisData);
          var strokeColor1 = calcTrailStroke(year, thisData);

          var lineX2 = calcTrailX(year + 1, thisData);
          var lineY2 = calcTrailY(year + 1, thisData);
          var fillColor2 = calcTrailFill(year + 1, thisData);
          var strokeColor2 = calcTrailStroke(year + 1, thisData);


          d3.select(`#${countryID}-trails line[data-year='${year}']`)
              .attr("x1", lineX1)
              .attr("y1", lineY1)
              .attr("x2", lineX1)
              .attr("y2", lineY1)
              .attr("stroke", strokeColor1)
              .attr("stroke-width", 2)
              .attr("fill", "none");

          d3.select(`#${countryID}-trails line[data-year='${year}']`)
              .transition()
              .duration(duration)
              .delay(duration * 2)
              .ease(d3.easeQuadInOut)
              .attr("x1", lineX1)
              .attr("y1", lineY1)
              .attr("x2", lineX2)
              .attr("y2", lineY2)
              .attr("stroke", strokeColor2)
              .attr("stroke-width", 2);



          /*
                    d3.select(this).select(`#${countryID}-trails circle[data-year='${year}']`)
                        .attr('cx', circleX2)
                        .attr('cy', circleY2)
                        .attr('r', circleR2)
                        .style('fill', fillColor2)
                        .style('stroke', strokeColor2);

                    d3.selectAll(`#${countryID}-trails circle[data-year='${year}']`)
                        .transition()
                        .duration(1000)
                        .ease(d3.easeQuadInOut)
                        .attr('cx', circleX2)
                        .attr('cy', circleY2)
                        .attr('r', circleR2)
                        .style('fill', fillColor2)
                        .style('stroke', strokeColor2);*/

      });
  };

  function tooltipYear(year, countryID, X, Y) {


      d3.selectAll(`#${countryID}-trails .tooltipYear`).select(function(d) {

          var boundingClientRect = d3.selectAll(`#${countryID}-trails circle[data-country='${countryID}']`).getBoundingClientRect();

          d3.select(this)
              .append('div')
              .style('display', 'block')
              .style('top', boundingClientRect.top + boundingClientRect.height)
              .style('left', boundingClientRect.left + boundingClientRect.width)
              .text("hello");


      })
  };



  function removeOldTrail(year) {

      d3.selectAll('.trails').select(function(d) {
          var countryID = d3.select(this).attr('name');
          var thisData = d3.select(`#${countryID}`).datum();

          d3.selectAll(`#${countryID}-trails circle`).select(function(d) {

              var circleX1 = calcTrailX(year, thisData);
              var circleY1 = calcTrailY(year, thisData);
              var circleR1 = calcTrailR(year, thisData);
              var fillColor1 = calcTrailFill(year, thisData);
              var strokeColor1 = calcTrailStroke(year, thisData);


              var overDate = d3.select(this).attr('data-year');
              if (overDate > year) {
                  d3.select(this)
                      .attr("cx", circleX1)
                      .attr("cy", circleY1)
                      .attr("cr", circleR1)
                      .attr("stroke-width", 0)
                      .attr("fill", "none");
              };

          });
          d3.selectAll(`#${countryID}-trails line`).select(function(d) {

              var overDate = d3.select(this).attr('data-year');
              if (overDate > year) {

                  d3.select(this)
                      .attr("x1", 0)
                      .attr("y1", 0)
                      .attr("x2", 0)
                      .attr("y2", 0)
                      .attr("y2", 0)
                      .attr("stroke", trailColor)
                      .attr("stroke-width", 0)
                      .attr("fill", "none");
              };

          });
      });

  };

  function playpause() {
      var updated = parseInt($(".year.label").text());
      $playBtn = $('#playbtn');

      if ($playBtn.hasClass('active')) {
          pause(updated);


      } else {
          play(updated);

      }

  }


  function play(year) {

      $playBtn = $('#playbtn');
      $playBtn.addClass('active');
      $playBtn.html('<span class="pause-icon"></span>');
      update(year, true);
      $(".year.label").text(year);

      if (year == maxYear) {
          //console.log("start over");
          play(minYear);
      }

  }

  function pause(year) {
      $playBtn = $('#playbtn');
      $playBtn.removeClass('active');
      $playBtn.html('<span class="play-icon"></span>');
      update(year, false);

  }

  // jquery accordion checkbox change
  function checkboxChange() {
      let anyCheckBoxOn = false;
      d3.selectAll('.checkboxes').select(function() {
          if (this.checked) { anyCheckBoxOn = true; }
      });
      if (anyCheckBoxOn) {
          d3.selectAll('.checkboxes').select(function() {
              var countryID = d3.select(this).attr('country');
              if (this.checked) {
                  var countryID = d3.select(this).attr('country');
                  //console.log(countryID);
                  d3.select(`#${countryID}`).style('opacity', '1');
                  d3.select(`#${countryID}tooltip`).style('display', 'block');
                  d3.select(`#${countryID}tooltip`).classed("selected", true)
                  makeTrail(countryID);

              } else {
                  d3.select(`#${countryID}`).style('opacity', '0.3');
                  d3.select(`#${countryID}tooltip`).style('display', 'none');
                  d3.select(`#${countryID}tooltip`).classed("selected", false);
                  //d3.select(`#${countryID}Group .trails`).remove();
                  removeTrail(countryID);
              }
          });
      } else {
          d3.selectAll('.checkboxes').select(function() {
              var countryID = d3.select(this).attr('country');
              d3.select(`#${countryID}`).style('opacity', '1');
              d3.select(`#${countryID}tooltip`).style('display', 'none');
              d3.select(`#${countryID}tooltip`).classed("selected", false);
              //d3.select(`#${countryID}Group .trails`).remove();
              removeTrail(countryID);
          });
      }
      attachListeners();
  }


  function checkboxRemove() {
      $('#accordion').find('input[type=checkbox]:checked').removeAttr('checked');
      checkboxChange();
  };




  $('#dropdownR-button .ui-selectmenu-icon').removeClass('ui-icon').removeClass('ui-icon-triangle-1-s').addClass('dropdownR').html("CHANGE");

  $('#dropdownX-button .ui-selectmenu-icon').removeClass('ui-icon').removeClass('ui-icon-triangle-1-s').addClass('dropdownX').html("CHANGE");

  $('#dropdownY-button .ui-selectmenu-icon').removeClass('ui-icon').removeClass('ui-icon-triangle-1-s').addClass('dropdownY').html("CHANGE");

  //$("#slider").on('input', function() {
  //$('#year-output').html($(this).val());
  //});