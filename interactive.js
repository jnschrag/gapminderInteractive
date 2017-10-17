$( function() {
    $( "#accordion" ).accordion({
        heightStyle: "fill"
    });
});

var data;

var xScale;
var yScale;
var xAxis;
var yAxis;
var radiusScale;
var wbCode;
var wbScale = {1:"#deebf7",2:"#c6dbef",3:"#9ecae1",4:"#6baed6",5:"#3182bd",6:"#08519c"}
var countryList = new Set();
var label;
var currentYear = 1995;
var currentX = "Perceived Rule Of Law";
var currentY = "Regulatory Quality";
var currentRadius = "GNI per Capita, PPP(ci$)";
var width;
var height;

var q = d3.csv("data/GDF_iLab.csv",function(result){
    for(var i=0;i<result.length;i++){
        countryList.add(result[i]["Country"]);
    }
    var categories = Object.keys(result[0]);
    
    for(var i=0;i<categories.length;i++){
        if(categories[i]!="Country"&&categories[i]!="Year"){
            if(categories[i]=="Perceived Rule Of Law"){
                d3.select("#dropdownX").append("option").html(categories[i]).attr("class","defaultoption");
            }
            else{
                d3.select("#dropdownX").append("option").html(categories[i]);
            }
        }
    }

    for(var i=0;i<categories.length;i++){
        if(categories[i]!="Country"&&categories[i]!="Year"){
            if(categories[i]=="Regulatory Quality"){
                d3.select("#dropdownY").append("option").html(categories[i]).attr("class","defaultoption");
            }
            else{
                d3.select("#dropdownY").append("option").html(categories[i]);
            }
        }
    }

    for(var i=0;i<categories.length;i++){
        if(categories[i]!="Country"&&categories[i]!="Year"){
            if(categories[i]=="GNI per Capita, PPP(ci$)"){
                d3.select("#dropdownR").append("option").html(categories[i]).attr("class","defaultoption");
            }
            else{
                d3.select("#dropdownR").append("option").html(categories[i]);
            }
        }
    }

    var defaultoptions = document.getElementsByClassName("defaultoption");
    for(var i=0;i<defaultoptions.length;i++){
        defaultoptions[i].selected=true;
    }
    countryList = Array.from(countryList)
    data = result;
    makeChart();
    makeBabyChart();
});

/*

*/



function isEmpty(d,theScale,year){
    return(d.filter(function(r){return r["Year"]==year;})[0][theScale]=="");
}

function getData(d,theScale,year){
    if(d.filter(function(r){return r["Year"]==year;})[0][theScale]==""){
        var yearIter = year - 1;
        while(yearIter>=1995){
            if(d.filter(function(r){return r["Year"]==yearIter;})[0][theScale]!=""){
                //console.log(this);
                return d.filter(function(r){return r["Year"]==yearIter;})[0][theScale];
            }
            yearIter = yearIter - 1;
        }

        yearIter = year + 1;
        while(yearIter<=2015){
            if(d.filter(function(r){return r["Year"]==yearIter;})[0][theScale]!=""){
                
                return d.filter(function(r){return r["Year"]==yearIter;})[0][theScale];
            }
            yearIter = yearIter + 1;
        }

        return getDomain(theScale)[0];
    }

    return d.filter(function(r){
        return r["Year"]==year;
    })[0][theScale]; 
}

function getYear(year,object){
    return parseInt(object[year]);
}

function getDomain(string){
    return domainCalc(data.map(function(d){
       return d[string]; 
    }))
}

function domainCalc(data){
    var max;
    var min;
    for(var i=0;i<data.length;i++){    
        var parsedNumber = parseFloat(data[i]);
        if(!isNaN(parsedNumber)){
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
    d3.select("#circleLegendLabel").text(currentRadius);

    d3.select("#circleLegendGraph")
    .selectAll("circle")
    .remove();

    d3.selectAll(".circleLabel")
    .remove();

    var boundingClientRect = document.getElementById("circleLegendGraph").getBoundingClientRect();

    d3.select("#circleLegendGraph")
    .selectAll("circle")
    .data(getDomain(currentRadius))
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

function changeXScale(newData){
    currentX = newData;
    d3.select("#xLabel").text(newData);
    xScale.domain(getDomain(newData)).range([0,width]);
    d3.select("#xAxis").transition().duration(1500).ease(d3.easeQuadInOut).call(xAxis);
    update(currentYear,false);   
}

function changeYScale(newData){
    currentY=newData;
    d3.select("#yLabel").text(newData);
    yScale.domain(getDomain(newData)).range([height,0]);
    d3.select("#yAxis").transition().duration(1500).ease(d3.easeQuadInOut).call(yAxis);
    update(currentYear,false);  
}

function changeRadius(newData){
    currentRadius = newData;
    radiusScale.domain(getDomain(newData)).range([2, 40]);
    update(currentYear,false); 
}

function makeChart(){

    d3.select("#theGraph").remove();
    d3.select("#tooltips").remove();
    var margin = {top: 19.5, right: 19.5, bottom: 49.5, left: 25};
    width = document.getElementById('graph').clientWidth - margin.right;
    height = 500 - margin.top - margin.bottom;

    xScale = d3.scaleLinear().domain(getDomain(currentX)).range([0, width]),
    yScale = d3.scaleLinear().domain(getDomain(currentY)).range([height, 0]),
    radiusScale = d3.scaleSqrt().domain(getDomain(currentRadius)).range([2, 40]);
    // The x & y axes.
    xAxis = d3.axisBottom(xScale).ticks(12, d3.format(",d")).tickSizeOuter(0);
    yAxis = d3.axisLeft(yScale).tickSizeOuter(0);
    // Create the SVG container and set the origin.

    var tooltips = d3.select("#graph").append("div").attr("id","tooltips");

    var svg = d3.select("#graph").append("svg")
    .attr("id","theGraph")
    .attr("width", width + margin.left+margin.right)
    .attr("height", height + margin.top + margin.bottom);

    var svgRoot = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("id", "gRoot");

    svgRoot.append("g")
    .attr("id","points")
    .selectAll("circle")
    .data(countryList.map(function(d){
       return data.filter(function(r){
        return r["Country"]===d;
       }) 
    }))
    .enter()
    .append("circle")
    .attr("id",function(d){return d[0]["Country"].replace(/ /g,'');})
    .attr("class","point")
    .attr("cx",function(d){
        return xScale(getData(d,currentX,currentYear));
    })
    .attr("cy",function(d){
        return yScale(getData(d,currentY,currentYear));
    })
    .attr("r",function(d){
        return radiusScale(getData(d,currentRadius,currentYear)); 
    })
    .style("fill",function(d){
        if(isEmpty(d,currentX,currentYear)||isEmpty(d,currentY,currentYear)||isEmpty(d,currentRadius,currentYear)){
            return "red";
        }
        else{
            return wbScale[d.filter(function(r){return r["Year"]==currentYear;})[0]["World Bank Classification"]];
        }
    });
    
    d3.selectAll(".point").select(function(d){
        var boundingClientRect = this.getBoundingClientRect();
        var theTooltip = d3.select("#tooltips")
        .append("div")
        .attr("class","tooltip")
        .attr("id",d[0]["Country"].replace(/ /g,'')+"tooltip")
        .style("top",boundingClientRect.top+boundingClientRect.height)
        .style("left",boundingClientRect.left+boundingClientRect.width);


        theTooltip.append('div')
        .attr("id",d[0]["Country"].replace(/ /g,'')+"tooltipcaption")
        .attr("class","tooltipcaption")
        .text(d[0]["Country"]);

        theTooltip.append('div')
        .attr("class","tooltipdetail")
        .attr("id",d[0]["Country"].replace(/ /g,'')+"tooltipX")
        .text(currentX+": "+(isEmpty(d,currentX,currentYear)?"No Data":getData(d,currentX,currentYear)));

        theTooltip.append('div')
        .attr("class","tooltipdetail")
        .attr("id",d[0]["Country"].replace(/ /g,'')+"tooltipY")
        .text(currentY+": "+getData(d,currentY,currentYear));

        theTooltip.append('div')
        .attr("class","tooltipdetail")
        .attr("id",d[0]["Country"].replace(/ /g,'')+"tooltipRadius")
        .text(currentRadius+": "+getData(d,currentRadius,currentYear));

        //theTooltip.remove();
    });

    var labelRoot = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("id", "labelRoot");

    labelRoot.append("g")
    .attr("id", "xAxis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

    labelRoot.append("g")
    .attr("id", "yAxis")
    .call(yAxis);

    // Add an x-axis label.
    labelRoot.append("text")
    .attr("id", "xLabel")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height - 6)
    .text(currentX);
    // Add a y-axis label.
    labelRoot.append("text")
    .attr("id", "yLabel")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text(currentY);
    // Add the year label; the value is set on transition.
    label = labelRoot.append("text")
    .attr("class", "year label")
    .attr("text-anchor", "end")
    .attr("y", height - 24)
    .attr("x", width)
    .text(1995);



    reorder();
}

function attachListeners(){
    d3.selectAll(".checkboxes").select(function(){
        if(this.checked){
            d3.select("#"+this.getAttribute('country'))
            .on("mouseenter",function(d){


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
                d3.select("#"+this.id+"tooltipX").style("display","block");
                d3.select("#"+this.id+"tooltipY").style("display","block");
                d3.select("#"+this.id+"tooltipRadius").style("display","block");

                d3.select("#"+this.id+"tooltip")
                .style("display","block");
            
                d3.select("#legend"+d[0]["Country"]).style("border","2px solid #E8336D");
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
                d3.select("#"+this.id+"tooltipX").style("display","none");
                d3.select("#"+this.id+"tooltipY").style("display","none");
                d3.select("#"+this.id+"tooltipRadius").style("display","none");

                d3.select("#"+this.getAttribute('id')+"tooltip")
                .style("display","none");

                d3.select("#legend"+d[0]["Country"]).style("border",null);
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
    .attr("cx",function(d){
        return xScale(getData(d,currentX,year));
    })
    .attr("cy",function(d){
        return yScale(getData(d,currentY,year)); 
    })
    .attr("r",function(d){
        return radiusScale(getData(d,currentRadius,year)); 
    });

    d3.selectAll(".point")
    .select(function(d){
        var boundingClientRect = this.getBoundingClientRect();
        
        d3.select("#"+d[0]["Country"].replace(/ /g,'')+"tooltip")
        .transition(t)
        .style("top",boundingClientRect.bottom)
        .style("left",boundingClientRect.right);
    
    });

    d3.selectAll(".point")
    .attr("cx",function(d){
        return xScale(getData(d,currentX,currentYear));
    })
    .attr("cy",function(d){
        return yScale(getData(d,currentY,currentYear));
    })
    .attr("r",function(d){
        return radiusScale(getData(d,currentRadius,currentYear)); 
    })
    .style("fill",function(d){
        if(isEmpty(d,currentX,year)||isEmpty(d,currentY,year)||isEmpty(d,currentRadius,year)){
            return "red";
        }
        else{
            return wbScale[d.filter(function(r){return r["Year"]==year;})[0]["World Bank Classification"]];
        }
    });

    d3.selectAll(".point")
    .transition(t)
    .attr("cx",function(d){
        return xScale(getData(d,currentX,year));
    })
    .attr("cy",function(d){
        return yScale(getData(d,currentY,year));
    })
    .attr("r",function(d){
        return radiusScale(getData(d,currentRadius,year));
    });
    
    d3.selectAll(".point").select(function(d){
        d3.select("#"+d[0]["Country"].replace(/ /g,'')+"tooltipX")
        .text(currentX+": "+(isEmpty(d,currentX,year)?"No Data":getData(d,currentX,year)));
        
        d3.select("#"+d[0]["Country"].replace(/ /g,'')+"tooltipY")
        .text(currentY+": "+(isEmpty(d,currentY,year)?"No Data":getData(d,currentY,year)));

        d3.select("#"+d[0]["Country"].replace(/ /g,'')+"tooltipRadius")
        .text(currentRadius+": "+(isEmpty(d,currentRadius,year)?"No Data":getData(d,currentRadius,year)));
    });

    document.getElementById('slider').value = parseInt(year);
    currentYear = parseInt(document.getElementById('slider').value);
    label.text(year);
}

function play(){
    if(parseInt(document.getElementById('slider').value)==2015){
        update(1995,true);        
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

/*
for(let country of mySet.values()){
    console.log(country);
    for(let y of year.values()){
        let theRecord = data.filter(function(d){return d["Country"]==country&&d["Year"]==y});
        console.log(","+theRecord["%ofWomenFormallyEmployed"]);
    }
    console.log("\n");
}
*/

//420 blaze it
