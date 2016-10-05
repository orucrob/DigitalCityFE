'use strict';
import 'babel-polyfill';
import './css/app.scss';
import * as d3 from 'd3';

const margin = {top: 20, right: 30, bottom: 30, left: 40};

//let urlDF = "https://service.digimesto.sk/DmApi/fakturyDodavatelske/148/2016?format=json";
const urlDF = "http://www.itinn.eu/dcapi/fakturyDodavatelske/148/2016?format=json";
//const urlDF = "../data/dm.json";
const appSelector = "#app";

function getMonth(isoDate){
	return isoDate.substring(5,7);
}
function curr(number){
	return number.toLocaleString('sk-SK', { style: 'currency', currency: 'EUR' })
}
function df(d){
	if(!(d instanceof Date)){
		d = new Date(d);
	}
	return dd(d.getDate()) +"."+ dd(d.getMonth()+1) +"." + d.getFullYear();
}
function dd(n){
	return n>9 ? n : "0"+n; 
}
function prepareData(json){
	    let data = d3.nest()
		    .key(function(d) { return getMonth(d["DatumZverejnenia"]); })
		    .sortKeys(d3.ascending)
		    .rollup(function(dd){
				return {
					sum: d3.sum(dd, function(g) { 
			      		return parseFloat(g["SumaCelkom"]);
			 			}),
					count: dd.length,
					detail: dd
				};
			 }).entries(json.Data);

		let keys = data.map(function(v){return v["key"];});
		return {
			data: data,
			keys: keys,
		};
}
function init(){
	d3.json(urlDF, function (json) {
	    let chartData = prepareData(json);
	    
	    drawChart(chartData);
	    
	    //update when resized
	    d3.select(window).on('resize', function(){drawChart(chartData);});

	});
}

function drawChart(chartData){
	    let data = chartData.data,
	    	keys = chartData.keys;

	    const appWidth = getAppWidth();
	    const width = appWidth - margin.left - margin.right;
	    const height = getWindowHeight()/2 - margin.top - margin.bottom;
    	var barWidth = width / data.length;

		var x = d3.scalePoint().domain(keys).rangeRound([0, width]).padding(.5);
    	var y = d3.scaleLinear()
			.domain([0, d3.max(data, function(g){return g.value.sum;})])
    		.range([40,height]);


    	var xAxis = d3.axisBottom(x).tickValues(keys);

	    //setup chart
		var chart = selectRoot('svg', 'chart')
	    	.attr('width', width + margin.left + margin.right)
	    	.attr("height", height + margin.top + margin.bottom);
		var chartG = chart.select("g.ch");
		if(chartG.empty()){
	    	chart = chart.append("g").attr('class','ch');
		}else{
			chart = chartG;
		}
    	chart.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	    
    	// chart.append("g")
    	// 	.attr("class", "x axis")
    	// 	.attr("transform", "translate(0," + height + ")")
    	// 	.call(xAxis);


    	//update
	    var bar = chart.selectAll('g.bar').data(data)
	    	.attr("transform", function(d, i) { return "translate(" + i * barWidth + ",0)"; })
	   	var rect = bar.select('rect')
 			.attr("x", 3)
 			.attr("y", function(d) { return height - y(d.value.sum); })
      		.attr("height", function(d) { return y(d.value.sum); })
      		.attr("width", barWidth - 3);
		
		bar.select("text.label1")
		    .attr("x", barWidth / 2)
		    .attr("y", function(d) { return height - y(d.value.sum) + 3; })
		    .attr("dy", ".75em")
		    .html(function(d) { return d.value.sum.toFixed(2) + " &euro;"; });
		bar.select("text.label2")
		    .attr("x", barWidth / 2)
		    .attr("y", function(d) { return height - y(d.value.sum) + 20; })
		    .attr("dy", ".75em")
		    .html(function(d) { return "#"+d.value.count ; });
	    
	    //create
	    var newBar = bar.enter().append('g').attr('class', 'bar')
	    	.attr("transform", function(d, i) { return "translate(" + i * barWidth + ",0)"; })
	    	.on('click', openGrid);

	    var newRect = newBar
	   		.append("rect")
 			.attr("x", 3)
 			.attr("y", function(d) { return height - y(d.value.sum); })
      		.attr("height", function(d) { return y(d.value.sum); })
      		.attr("width", barWidth - 3);
      		
		newBar.append("text").attr('class', 'label1')
		    .attr("x", barWidth / 2)
		    .attr("y", function(d) { return height - y(d.value.sum) + 3; })
		    .attr("dy", ".75em")
		    .html(function(d) { return curr(d.value.sum); });
		newBar.append("text").attr('class', 'label2')
		    .attr("x", barWidth / 2)
		    .attr("y", function(d) { return height - y(d.value.sum) + 20; })
		    .attr("dy", ".75em")
		    .html(function(d) { return "#"+d.value.count ; });

}

function openGrid(data){
	
	var color = d3.scaleOrdinal(d3.schemeCategory20 );
	var size = 380;


	let gridData = d3.nest()
		    .key(function(d) { return d["DodavatelIco"]; })
		    //.sortKeys(d3.ascending)
		    .rollup(function(dd){
				return {
					sum: d3.sum(dd, function(g) { 
			      		return parseFloat(g["SumaCelkom"]);
			 			}),
					name: dd[0]["DodavatelNazov"],
					count: dd.length,
					detail: dd
				};
			 }).entries(data.value.detail)
		    .sort(function(a, b){ return d3.descending(a.value.sum, b.value.sum); });

	//PIE
	let pieSvg = selectRoot('svg','pie1');
	pieSvg = pieSvg.attr('width', size).attr('height', size);
	let pieSvgG = pieSvg.select("g.ch");
	let pieSvgHover = pieSvg.select("g.hov");
	if(pieSvgHover.empty()){
    	pieSvgHover = pieSvg.append("g").attr('class','hov');
	}
	if(pieSvgG.empty()){
    	pieSvg = pieSvg.append("g").attr('class','ch');
	}else{
		pieSvg = pieSvgG;
	}
	pieSvg.attr('transform', 'translate(' + (size / 2) + ',' + (size / 2) + ')');
	pieSvgHover.attr('transform', 'translate(' + (size / 2) + ',' + (size / 2) + ')');


	var r = (size-80)/2;
	var arc = d3.arc().innerRadius(0).outerRadius(r);
	var arcOn = d3.arc().innerRadius(r).outerRadius(r + 20);
	var pieData = d3.pie().value(function(d) { return d.value.sum;})(gridData);

	//pie (without selection)
	var path = pieSvg.selectAll('path').data(pieData).attr('class', function(d,i){return "p"+i;});
	path.transition().duration(750).attrTween("d", function(d) {
  			var i = d3.interpolate(this._current, d);
  			this._current = i(0);
  			return function(t) {
    			return arc(i(t));
  			};
		});
	path.exit().remove();
	var newPath = path.enter()
		.append('path')
		.attr('d', arc)
		.attr('fill', function(d,i){return color(i);})
		.attr('class', function(d,i){return "p"+i;})
		.each(function(d) { this._current = d; })// store the initial angles for transitions
		.on('mouseover', pieOn)
		// function(d, i, paths) {
		// 	let c = d3.color(color(i));
		// 	c.opacity = 0.5;
		// 	pieSvgHover.append('path').attr('d', arcOn(d)).attr('fill', c.toString());
		// 	grid.selectAll('.row.idx'+i).classed('selected',true).style('background', c.toString());

		// 	//d.data.
		// 	console.log('aa',arguments);
		// })
		.on('mouseout', pieOff);
		// function(d, i, paths) {
		// 	pieSvgHover.selectAll('path').remove();
		// 	grid.selectAll('.row.idx'+i).classed('selected',false).style('background',null);
		// });

	//selection for pie charts
	var pathHov = pieSvgHover.selectAll('path').data(pieData).attr('class', function(d,i){return "p"+i;}).attr('d', arcOn);
	pathHov.exit().remove();
	var newPathHov = pathHov.enter()
		.append('path')
		.attr('d', arcOn)
		.attr('fill', function(d,i){
			let c = d3.color(color(i));
			c.opacity = 0.5;
			return c.toString();
		})
		.attr('class', function(d,i){return "p"+i;});


	//GRID
	var grid = selectRoot('div', 'grid1');

	grid.style('border', '1px solid black');
	var row = grid.selectAll('.row')
		.data(gridData).attr('class',function(d,i){return "row idx"+i;});
	row.select(".col").attr('min-width', '1em').style('min-height', '1em').style('background', function(d,i){return color(i);});
	row.select(".sum").text(function(d,i){return curr(d.value.sum);});
	row.select(".title").text(function(d,i){return d.value.name;});
	row.select(".subject").text(function(d,i){return "#"+ d.value.count;});

	row.exit().remove();
	
	var newRow = row.enter().append('div')
		.attr('class',function(d,i){return "row idx"+i;});
	newRow.append("div").attr("class","col").style('min-width', '1em').style('min-height', '1em').style('background', function(d,i){return color(i);});
	newRow.append("div").attr("class","sum").text(function(d,i){return curr(d.value.sum);});
	newRow.append("div").attr("class","title").text(function(d,i){return d.value.name;});
	newRow.append("div").attr("class","subject").text(function(d,i){return "#"+ d.value.count;});
	newRow.on('click', openGrid2)
		.on('mouseover', pieOn)
		.on('mouseout', pieOff);
}
function pieOn(d,i){
	console.log('pie on', i);
	var c = d3.selectAll('svg.pie1 .hov .p'+i).classed('on', true).attr("fill");
	d3.selectAll('div.grid1 .row.idx'+i).classed('selected',true).style('background',c);
}
function pieOff(d,i){
	d3.selectAll('svg.pie1 .hov .p'+i).classed('on', false);
	d3.selectAll('div.grid1 .row.idx'+i).classed('selected',false).style('background',null);
}

function openGrid2(data){
	console.log('GRID data:', data.value.detail);
	var gridData = data.value.detail.sort(function(a, b){ return d3.descending(a["SumaCelkom"], b["SumaCelkom"]); });


	var grid = selectRoot('div', 'grid2');

	// var grid = d3.select('body').selectAll('.grid2').data([1]);
	// grid.exit().remove();
	// grid = grid.enter().append("div").attr('class', 'grid2').merge(grid);


	grid.style('border', '1px solid black');
	var row = grid.selectAll('.row').data(gridData);
	row.select(".sum").text(function(d,i){return d["SumaCelkom"];});
	row.select(".time").text(function(d,i){return d["DatumZverejnenia"];});
	row.select(".subject").text(function(d,i){return d["Predmet"];});
	
	row.exit().remove();
	
	var newRow = row.enter().append('div').attr('class','row');
	newRow.append("div").attr("class","no").text(function(d,i){return "#"+(i+1);});
	newRow.append("div").attr("class","sum").text(function(d,i){return curr(d["SumaCelkom"]);});
	newRow.append("div").attr("class","date").text(function(d,i){return df(d["DatumZverejnenia"]);});
	newRow.append("div").attr("class","subject").text(function(d,i){return d["Predmet"];});
}

function selectRoot(elem, cls){
	var sel = d3.select(appSelector).selectAll(elem+'.'+cls).data([1]);
	sel.exit().remove();
	sel = sel.enter().append(elem).attr('class', cls).merge(sel);
	return sel;

}
function getAppWidth(){
	return parseInt(d3.select(appSelector).style("width"),10); 
	return 900;
}

function getWindowHeight(){
	let w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    x = w.innerWidth || e.clientWidth || g.clientWidth,
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
	return y; 
}

//     // Define responsive behavior
// function resize() {
//       var width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right,
//       height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;

//       // Update the range of the scale with new width/height
//       xScale.range([0, width]);
//       yScale.range([height, 0]);

//       // Update the axis and text with the new scale
//       svg.select('.x.axis')
//         .attr("transform", "translate(0," + height + ")")
//         .call(xAxis);

//       svg.select('.y.axis')
//         .call(yAxis);

//       // Force D3 to recalculate and update the line
//       svg.selectAll('.line')
//         .attr("d", function(d) { return line(d.datapoints); });

//       // Update the tick marks
//       xAxis.ticks(Math.max(width/75, 2));
//       yAxis.ticks(Math.max(height/50, 2));

//     };

//     // Call the resize function whenever a resize event occurs
//     d3.select(window).on('resize', resize);

//     // Call the resize function
//     resize();

window.onload = init;

