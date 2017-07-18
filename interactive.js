$( function() {
    $( "#accordion" ).accordion({
        collapsible: true,
        heightStyle: "fill"
    });
  } );

var getX;
var getY;
var getCircle;
var xScaleRange;
var yScaleRange;
var circleScaleRange;
var xScale;
var yScale;
var radiusScale;
var wbCode;
var wbScale = {1:"#deebf7",2:"#c6dbef",3:"#9ecae1",4:"#6baed6",5:"#3182bd",6:"#08519c"}
var countryList = []
var label;
var currentYear = 1996;

var q = d3.queue()
    .defer(d3.csv, "data/circle.csv")
    .defer(d3.csv, "data/xScale.csv")
    .defer(d3.csv, "data/yScale.csv")
    .defer(d3.csv, "data/wbcode.csv")
    .awaitAll(function(error, results) {
    if (error) throw error;
    for(var i=0;i<results[0].length;i++){
        countryList.push(results[0][i]["Country"]);
    }
    getCircle = getCountryDataFunc(results[0]);
    circleScaleRange = getRange(results[0],parseInt);
    getX = getCountryDataFunc(results[1]);
    xScaleRange = getRange(results[1],parseFloat);
    getY = getCountryDataFunc(results[2]);
    yScaleRange = getRange(results[2],parseFloat);
    wbCode = getCountryDataFunc(results[3]);
    makeChart();
});

function getCountryDataFunc(data){
    return function(country){
        for(var i=0;i<data.length;i++){
            if(data[i]["Country"]==country){
                return data[i];
            }
        }
    }
}

function getYear(year,object){
    return parseInt(object[year]);
}

function getRange(data,parseFunction){
    var max;
    var min;
    for(var i=0;i<data.length;i++){
        for(var key in data[i]){
            if(key!=="Country"){
                var parsedNumber = parseFunction(data[i][key]);
                if(max===undefined){
                    max = parsedNumber;
                    min = parsedNumber;
                }
                if(min>parsedNumber){
                    min=parsedNumber;
                }
                if(max<parsedNumber){
                    max=parsedNumber;
                }
            }
        }
    }
    return [min,max];
}

function reorder(){
    var allPoints = document.getElementsByClassName("point");
    var pointsNode = document.getElementById("points");
    var new_pointsNode = pointsNode.cloneNode(false);
    
    var z=document.getElementsByClassName("point").length;
    while(z>0)
    {   
        var maxIndex = findMax(allPoints);
        var theNode = allPoints[maxIndex].cloneNode(true);
        new_pointsNode.append(theNode);
        d3.select(theNode).data(d3.select(allPoints[maxIndex]).data());
        allPoints[maxIndex].remove();
        z--;
    }
    document.getElementById('gRoot').appendChild(new_pointsNode);
    pointsNode.remove();
    attachListeners();
}

function findMax(arr){
    var max = 0;
    for(var i=0;i<arr.length;i++){
        if(parseFloat(arr[i].getAttribute('r'))>parseFloat(arr[max].getAttribute('r'))){
            max = i;
        }
    }
    return max;
}

function makeChart(){

    d3.select("#theGraph").remove();
    var margin = {top: 19.5, right: 19.5, bottom: 49.5, left: 25};
    var width = document.getElementById('graph').clientWidth - margin.right;
    var height = 500 - margin.top - margin.bottom;

    xScale = d3.scaleLinear().domain(xScaleRange).range([0, width]),
    yScale = d3.scaleLinear().domain(yScaleRange).range([height, 0]),
    radiusScale = d3.scaleSqrt().domain(circleScaleRange).range([2, 40]);
    // The x & y axes.
    var xAxis = d3.axisBottom(xScale).ticks(12, d3.format(",d")).tickSizeOuter(0),
    yAxis = d3.axisLeft(yScale).tickSizeOuter(0);
    // Create the SVG container and set the origin.

    var tooltips = d3.select("#graph").append("div").attr("id","tooltips");

    var svg = d3.select("#graph").append("svg")
    .attr("id","theGraph")
    .attr("width", width + margin.left+margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("id", "gRoot");

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

    svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

    // Add an x-axis label.
    svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height - 6)
    .text("Perceived Rule of Law");
    // Add a y-axis label.
    svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Regulatory Quality");
    // Add the year label; the value is set on transition.
    label = svg.append("text")
    .attr("class", "year label")
    .attr("text-anchor", "end")
    .attr("y", height - 24)
    .attr("x", width)
    .text(1996);


    svg.append("g")
    .attr("id","points")
    .selectAll("circle")
    .data(countryList.map(function(d){return [d,getX(d),getY(d),getCircle(d),wbCode(d).wbcode];}))
    .enter()
    .append("circle")
    .attr("id",function(d){return d[0].replace(/ /g,'');})
    .attr("country",function(d){return d[0]})
    .attr("class","point")
    .style("fill",function(d){return wbScale[d[4]]})
    .attr("cx",function(d){return xScale(d[1]["1996"]);})
    .attr("cy",function(d){return yScale(d[2]["1996"]);})
    .attr("r",function(d){return radiusScale(d[3]["1996"])});

    reorder();
    
    d3.selectAll(".point").select(function(d){
        var boundingClientRect = this.getBoundingClientRect();
        d3.select("#tooltips")
        .append("div")
        .attr("class","tooltip")
        .attr("id",d[0].replace(/ /g,'')+"tooltip")
        .style("top",boundingClientRect.top+boundingClientRect.height)
        .style("left",boundingClientRect.left+boundingClientRect.width)
        .text(d[0]);
    });

    attachListeners();
}

function attachListeners(){
    d3.selectAll(".checkboxes").select(function(){
        if(this.checked){
            d3.select("#"+this.getAttribute('country'))
            .on("mouseenter",null)
            .on("mouseleave",null);
        }
        else{
            d3.select("#"+this.getAttribute('country'))
            .on("mouseenter",function(){
                d3.select("#"+this.getAttribute('id')+"tooltip")
                .style("display","block");
            })
            .on("mouseleave",function(){
                d3.select("#"+this.getAttribute('id')+"tooltip")
                .style("display","none");
            });
        } 
    });
}

function yearChange(year){
    update(parseInt(year),false);
}

function update(year,playButton){
    d3.selectAll(".point")
    .attr("cx",function(d){return xScale(d[1][year]);})
    .attr("cy",function(d){return yScale(d[2][year]);})
    .attr("r",function(d){return radiusScale(d[3][year]);});

    var t = d3.transition()
    .duration(1000)
    .ease(d3.easeQuadInOut)
    .on('end',function(){
        if(year<2015&&playButton){
            update(year+1,playButton)
        }
        else{
            reorder();
        }
    });

    d3.selectAll(".point")
    .select(function(d){
        var boundingClientRect = this.getBoundingClientRect();
        
        d3.select("#"+d[0].replace(/ /g,'')+"tooltip")
        .transition(t)
        .style("top",boundingClientRect.bottom)
        .style("left",boundingClientRect.right);
    });

    d3.selectAll(".point")
    .attr("cx",function(d){return xScale(d[1][currentYear]);})
    .attr("cy",function(d){return yScale(d[2][currentYear]);})
    .attr("r",function(d){return radiusScale(d[3][currentYear]);});

    d3.selectAll(".point")
    .transition(t)
    .attr("cx",function(d){return xScale(d[1][year]);})
    .attr("cy",function(d){return yScale(d[2][year]);})
    .attr("r",function(d){return radiusScale(d[3][year]);});

    document.getElementById('slider').value = year;
    currentYear = document.getElementById('slider').value;

    label.text(year);
}

function play(){
    
    if(parseInt(document.getElementById('slider').value)==2015){
        update(1996,true);        
    }
    else{
        update(parseInt(document.getElementById('slider').value)+1,true);
    }
}

function checkboxChange(){
    var anyCheckBoxOn = false;
    d3.selectAll(".checkboxes").select(function(){
        if(this.checked){anyCheckBoxOn=true;}
    });
    if(anyCheckBoxOn){

        d3.selectAll(".checkboxes").select(function(){
            if(this.checked){
                d3.select("#"+this.getAttribute('country')).style("opacity","1");
                d3.select("#"+this.getAttribute('country')+"tooltip").style("display","block");
            }
            else{
                d3.select("#"+this.getAttribute('country')).style("opacity","0.6");
                d3.select("#"+this.getAttribute('country')+"tooltip").style("display","none");
            }
        });
    }
    else{
        d3.selectAll(".checkboxes").select(function(){
            d3.select("#"+this.getAttribute('country')).style("opacity","1");
            d3.select("#"+this.getAttribute('country')+"tooltip").style("display","none");
        });
    }
    attachListeners();
}

window.onresize = makeChart;


/*
var margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 39.5},
width = 960 - margin.right,
height = 500 - margin.top - margin.bottom;
// Various scales. These domains make assumptions of data, naturally.
var xScale = d3.scale.log().domain([300, 1e5]).range([0, width]),
yScale = d3.scale.linear().domain([10, 85]).range([height, 0]),
radiusScale = d3.scale.sqrt().domain([0, 5e8]).range([0, 40]),
colorScale = d3.scale.category10();
// The x & y axes.
var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(12, d3.format(",d")),
yAxis = d3.svg.axis().scale(yScale).orient("left");
// Create the SVG container and set the origin.
var svg = d3.select("#chart").append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
.attr("class", "gRoot")
*/