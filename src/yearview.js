import * as d3 from 'd3';
import  dataapi from './dataapi';
import {ymf, mf,df,dd,curr, selectRoot, getAppWidth, getWindowHeight, getHash, saveToHash, clearFromHash, fire, getMissingMonths} from './util';
import * as obec from './obec';


const margin = {top: 20, right: 30, bottom: 30, left: 40};
const color = d3.scaleOrdinal(d3.schemeCategory20 );


function prepareData(json){
	    let data = d3.nest()
		    .key(function(d) { return ymf(d["DatumZverejnenia"]); })
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
		
		//add empty months
		let missing = getMissingMonths(keys);
		if(missing && missing.length>0){
			missing.forEach(function(m){
				data.push({
					key: m,
					value:{
						sum: 0,
						count:0,
						detail:[]
					}
				});
				keys.push(m);

			});		
			keys.sort(d3.ascending);
			data.sort(function(a, b){ return d3.ascending(a.key, b.key);});
		}

		return {
			data: data,
			keys: keys,
		};
}
export async function drawApp(otag, year){
	otag = otag || getHash()['o'];
	year = year || getHash()['y'] || new Date().getFullYear();

	let orgRec = await obec.getOrgRec(otag),
		orgId = orgRec && orgRec['OrganizaciaId'];

	if(orgId){
		d3.json(dataapi.faDod(orgId, year), function (json) {
		    if(json){
			    let chartData = prepareData(json);
			    drawChart(chartData , orgRec, year);
			    //TODO be sure, that resize is listented only once
			    d3.select(window).on('resize', function(){
			    	drawChart(chartData, orgRec, year);
			    });
		    }else{
		    	//TOOD remove chart and grids
		    }
		}).on('error', function(ev){
			let xhr = ev.srcElement,
				status = xhr.status;
			fire('dataapierror', [status, xhr]);
		});
	}else{
		obec.draw();
	}

}

var years = {};
function loadYears(orgId){
	return new Promise(function(resolve, reject){
		d3.json(dataapi.faDodYears(orgId), function (json) {
		    if(json && json.Data){
			    resolve(json.Data);
		    }else{
		    	reject(json);
		    }
		}).on('error', function(ev){
			let xhr = ev.srcElement,
				status = xhr.status;
			fire('dataapierror', [status, xhr]);
		});
	});
}
async function getYears(orgId){
	if(!years[orgId+'']){
		years[orgId+''] = loadYears(orgId);
	}
	return await years[orgId+''];
} 

async function drawChart(chartData, obecRec, year){
	    let data = chartData.data,
	    	keys = chartData.keys;
	    obecRec = obecRec || {};

	    const appWidth = getAppWidth();
	    const width = appWidth - margin.left - margin.right;
	    const height = getWindowHeight()/2 - margin.top - margin.bottom;
    	var barWidth = width / data.length;

		var x = d3.scalePoint().domain(keys).rangeRound([0, width]).padding(.5);
    	var y = d3.scaleLinear()
			.domain([0, d3.max(data, function(g){return g.value.sum;})])
    		.range([40,height]);


    	var xAxis = d3.axisBottom(x).tickValues(keys);

	    //setup title
		var chartTitle = selectRoot('div', 'chartTitle')

		var heading = chartTitle.select('.heading');
		heading = heading.empty() ? chartTitle.append('div').attr('class','heading') : heading;
		heading.text("Invoices (suppliers)");

		var name = chartTitle.select('.name');
		name = name.empty() ? chartTitle.append('div').attr('class','name') : name;
		name.html(`OID: ${obecRec["OrganizaciaId"]} Title: <b>${obecRec["Nazov"]}</b> (${obecRec["HashTag"]}) - Year: `);

		var yearSel = name.select('select');
		yearSel = yearSel.empty() ? name.append('select') : yearSel;
		yearSel.selectAll('option').remove();
		yearSel.append('option').text(''+year);
		yearSel.on('change', function(){
			let newY = parseInt(this.value, 10);
			if(year != newY){
				saveToHash('y', newY);
				drawApp();
			}
		});


		//update select with years
		try{
			let years = await getYears(obecRec["OrganizaciaId"]);
			let opt = yearSel.selectAll('option').data(years);
			opt.enter().append('option').merge(opt)
				.attr("value", function(d){return d["id"];})
				.text(function(d){return d["rok"]})
				.attr('selected', function(d){ return  year == d["id"] ? true : null});
			opt.exit().remove();
		}catch(e){
			console.log('Error: cannot set years.', e);
		}

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
	    
    	var axisG = chart.selectAll("g.x.axis");
    	if(axisG.empty()){
	    	axisG = chart.append("g").attr("class", "x axis");
    	}
    	axisG.attr("transform", "translate(0," + height + ")").call(xAxis);


    	//update
	    var bar = chart.selectAll('g.bar').data(data)
	    	.attr("transform", function(d, i) { return "translate(" + i * barWidth + ",0)"; })

	   	var rect = bar.select('rect').transition().duration(750)
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

		//remove
		bar.exit().remove();

		//open month from hash
		let month = +getHash()['m'];
 		if(month && month>0 && month<data.length){
 			openGrid(data[month-1], month-1, chart.selectAll('g.bar').nodes());
 		}else{
 			clearGrid();
 		}


}

function clearGrid(){
	d3.selectAll('svg.pie1').remove();
	d3.selectAll('div.grid1').remove();
	clearFromHash('m');
}

function openGrid(data, idx, allBars){
	//save month to hash
	saveToHash("m", (idx+1)+"");
	let width = d3.select('svg.chart').attr("width");
	var size = width/3;

	//mark selected bar
	d3.selectAll(allBars).classed('selected', function(d, i){return i==idx;});
	
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


	var r = (size-100)/2;
	var arc = d3.arc().innerRadius(r*0.5).outerRadius(r);
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

	var removePath = path.exit();
	removePath.transition().duration(750).attrTween("d", function(d) {
  			var iEnd = d3.interpolate(d.endAngle, 2 * Math.PI);
  			var iStart = d3.interpolate(d.startAngle, 2 * Math.PI);
  			return function(t) {
  				d.startAngle = iStart(t);
  				d.endAngle = iEnd(t);
    			return arc(d);
  			};
		}).on('end', function(){
			removePath.remove();
		});

	var newPath = path.enter()
		.append('path')
//		.attr('d', arc)
		.attr('fill', function(d,i){return color(i);})
		.attr('class', function(d,i){return "p"+i;});
	newPath.transition().duration(750).attrTween("d", function(d) {
  			var iEnd = d3.interpolate( 2 * Math.PI,d.endAngle);
  			var iStart = d3.interpolate(2 * Math.PI, d.startAngle);
  			this._current = d; // store the initial angles for transitions
  			return function(t) {
  				d.startAngle = iStart(t);
  				d.endAngle = iEnd(t);
    			return arc(d);
  			};
		});
	//newPath.each(function(d) { this._current = d; });// store the initial angles for transitions
	newPath.on('mouseover', pieOn)
		.on('mouseout', pieOff);

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

	//grid.style('border', '1px solid black').style('width', size+'px');
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
	newRow
		.on('mouseover', pieOn)
		.on('mouseout', pieOff)
		.on('mousemove', movegrid);
}
function pieOn(d,i){
	var c = d3.selectAll('svg.pie1 .hov .p'+i).classed('on', true).attr("fill");
	d3.selectAll('div.grid1 .row.idx'+i).classed('selected',true).style('background',c);
	openGrid2(d);
}
function pieOff(d,i){
	d3.selectAll('svg.pie1 .hov .p'+i).classed('on', false);
	d3.selectAll('div.grid1 .row.idx'+i).classed('selected',false).style('background',null);
	closeGrid2();
}


let grid2;
let grid2Height = 0;
let grid2Width = 0;
let bodyHeight = 0;
let bodyWidth = 0;

function openGrid2(data){
	let gridData = data.data && data.data.value.detail || data.value.detail;
	gridData = gridData.sort(function(a, b){ return d3.descending(a["SumaCelkom"], b["SumaCelkom"]); });
	var coo = d3.mouse(d3.select('body').node());
	
	grid2 = d3.select('.grid2');
	if(grid2.empty()){
		grid2 = d3.select('body').append('div').attr('class','grid2');
	}	

	grid2.style("transform", "translate(" + (coo[0]+50) + "px," + coo[1] + "px)");;
	//title
	var title = grid2.selectAll('.rowtitle').data([1]);
	title.enter().append('div').attr('class', 'rowtitle').attr('colspan',4).merge(title).text(gridData && gridData[0] && gridData[0]["DodavatelNazov"] || "??");

	//inner grid
	var innerGrid = grid2.selectAll('.innergrid').data([1]);
	innerGrid = innerGrid.enter().append('div').attr('class', 'innergrid').merge(innerGrid);

	//rows
	var row = innerGrid.selectAll('.row').data(gridData);
	row.select(".sum").text(function(d,i){return d["SumaCelkom"];});
	row.select(".time").text(function(d,i){return d["DatumZverejnenia"];});
	row.select(".subject").text(function(d,i){return d["Predmet"];});
	
	row.exit().remove();
	
	var newRow = row.enter().append('div').attr('class','row');
	newRow.append("div").attr("class","no").text(function(d,i){return "#"+(i+1);});
	newRow.append("div").attr("class","sum").text(function(d,i){return curr(d["SumaCelkom"]);});
	newRow.append("div").attr("class","date").text(function(d,i){return df(d["DatumZverejnenia"]);});
	newRow.append("div").attr("class","subject").text(function(d,i){return d["Predmet"];});

	grid2Height = parseInt(grid2.style('height'),10);
	grid2Width = parseInt(grid2.style('width'),10);
	bodyHeight = parseInt(d3.select('body').style('height'),10);
	bodyWidth = parseInt(d3.select('body').style('width'),10);
}
function closeGrid2(){
	d3.select('.grid2').remove();
	grid2 = undefined;
}

function movegrid(){
	var coo = d3.mouse(d3.select('body').node());
	if(grid2){
		if(grid2Height+coo[1] > bodyHeight-20){
			coo[1] -= grid2Height+10;
		}
		if(grid2Width+coo[0] > bodyWidth-70 && coo[0]- grid2Width > 50){
			coo[0] -= grid2Width+50;
		}else{
			coo[0] +=50;
		}
		grid2.style("transform", "translate(" + (coo[0]) + "px," + coo[1] + "px)");
	}
}

