$( function() {
    $( "#accordion" ).accordion({
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
    makeBabyChart();
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

function makeBabyChart(){
    d3.select("#circleLegendGraph")
    .selectAll("circle")
    .remove();

    d3.selectAll(".circleLabel")
    .remove();

    var boundingClientRect = document.getElementById("circleLegendGraph").getBoundingClientRect();

    d3.select("#circleLegendGraph")
    .selectAll("circle")
    .data([24520,380])
    .enter()
    .append("circle")
    .attr("class","legendCircles")
    .attr("cx",boundingClientRect.width/2)
    .attr("cy",boundingClientRect.height/2)
    .attr("r",function(d){return radiusScale(d);})
    .style("fill","white");
    
    d3.selectAll(".legendCircles").select(function(d){
        var boundingClientRect = this.getBoundingClientRect();
        
        d3.select("#circleLegendGraph")
        .append("text")
        .attr("x",parseFloat(this.getAttribute('cx'))+boundingClientRect.width/2)
        .attr("y",parseFloat(this.getAttribute('cy'))+boundingClientRect.height/2)
        .attr("class","circleLabel")
        .text(d);
    });
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

    reorder();
}

function attachListeners(){
    d3.selectAll(".checkboxes").select(function(){
        if(this.checked){
            d3.select("#"+this.getAttribute('country'))
            .on("mouseenter",function(d){
                d3.select("#tempCirc").remove();
                d3.select("#tempLabel").remove();

                d3.select("#legend"+d[4]).style("border","2px solid #E8336D");
                d3.select(this).style("stroke","#E8336D");
                d3.select(this).style("stroke-width","3px");

                var boundingClientRect = document.getElementById("circleLegendGraph").getBoundingClientRect();
                
                d3.select("#circleLegendGraph")
                .append("circle")
                .attr("id","tempCirc")
                .attr("cx",boundingClientRect.width/2)
                .attr("cy",boundingClientRect.height/2)
                .attr("r",this.getAttribute('r'))
                .style("fill","white")
                .style("stroke","#E8336D");
            
                var currentGNI = d[3][currentYear];

                d3.select("#circleLegendGraph")
                .append("text")
                .attr("x",parseFloat(this.getAttribute('r'))/2+boundingClientRect.width/2)
                .attr("y",parseFloat(this.getAttribute('r'))/2+boundingClientRect.height/2)
                .attr("id","tempLabel")
                .text(currentGNI);

                d3.selectAll(".circleLabel")
                .style("opacity",0.3);
            })
            .on("mouseleave",function(d){
                d3.select("#legend"+d[4]).style("border",null);
                d3.select(this).style("stroke","black");
                d3.select(this).style("stroke-width","1px");
                d3.select("#tempCirc").remove();
                d3.select("#tempLabel").remove();
                d3.selectAll(".circleLabel")
                .style("opacity",1);
            });
        }
        else{
            d3.select("#"+this.getAttribute('country'))
            .on("mouseenter",function(d){
                d3.select("#tempCirc").remove();
                d3.select("#tempLabel").remove();

                d3.select("#"+this.getAttribute('id')+"tooltip")
                .style("display","block");
            
                d3.select("#legend"+d[4]).style("border","2px solid #E8336D");
                d3.select(this).style("stroke","#E8336D");
                d3.select(this).style("stroke-width","3px");

                var boundingClientRect = document.getElementById("circleLegendGraph").getBoundingClientRect();

                d3.select("#circleLegendGraph")
                .append("circle")
                .attr("id","tempCirc")
                .attr("cx",boundingClientRect.width/2)
                .attr("cy",boundingClientRect.height/2)
                .attr("r",this.getAttribute('r'))
                .style("fill","white")
                .style("stroke","#E8336D");

                var currentGNI = d[3][currentYear];

                d3.select("#circleLegendGraph")
                .append("text")
                .attr("x",parseFloat(this.getAttribute('r'))/2+boundingClientRect.width/2)
                .attr("y",parseFloat(this.getAttribute('r'))/2+boundingClientRect.height/2)
                .attr("id","tempLabel")
                .text(currentGNI);

                d3.selectAll(".circleLabel")
                .style("opacity",0.3);
            })
            .on("mouseleave",function(d){
                d3.select("#"+this.getAttribute('id')+"tooltip")
                .style("display","none");

                d3.select("#legend"+d[4]).style("border",null);
                d3.select(this).style("stroke","black");
                d3.select(this).style("stroke-width","1px");

                d3.select("#tempCirc").remove();
                d3.select("#tempLabel").remove();
                d3.selectAll(".circleLabel")
                .style("opacity",1);
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
            attachListeners();
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
                d3.select("#"+this.getAttribute('country')).style("opacity","0.3");
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

window.onresize = resizefunc;

function resizefunc(){
    makeChart();
    makeBabyChart();
};

//420 blaze it
