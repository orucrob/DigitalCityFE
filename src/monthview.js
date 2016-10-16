import * as d3 from 'd3';
import * as dataapi from './dataapi';
import * as u from './util';
import './css/monthview.scss';
import * as obec from './obec';
import * as sv from './suppview';


const color = d3.scaleOrdinal(d3.schemeCategory20 );


export function remove(){
	d3.selectAll('div.monthview').remove();
	sv.remove();
	u.clearFromHash('m');
}

export function draw(otag, year, data, title){
	//prepare data
	let gridData = d3.nest()
		    .key(function(d) { return d["DodavatelIco"]; })
		    //.sortKeys(d3.ascending)
		    .rollup(function(dd){
				return {
					sum: d3.sum(dd, function(g) { 
			      		return parseFloat(g["SumaCelkom"]);
			 			}),
					name: dd[0]["DodavatelNazov"],
					ico: dd[0]["DodavatelIco"],
					count: dd.length,
					detail: dd
				};
			 }).entries(data.value.detail)
		    .sort(function(a, b){ return d3.descending(a.value.sum, b.value.sum); });

	//basic html structure
	let mvDiv = u.selectRoot('div','monthview')
	//HEADER
	let headerDiv = mvDiv.selectAll('div.viewtitle');
	headerDiv = headerDiv.empty() ? mvDiv.append('div').attr('class','viewtitle') : headerDiv;
	headerDiv.text(title || "");

	//charts
	let chartDiv = mvDiv.selectAll('div.charts');
	chartDiv = chartDiv.empty() ? mvDiv.append('div').attr('class','charts') : chartDiv;

	//PIE
	let pieDiv = chartDiv.selectAll('div.pie');
	pieDiv = pieDiv.empty() ? chartDiv.append('div').attr('class','pie') : pieDiv;
	let pieSvg = pieDiv.selectAll('svg.pie1');
	pieSvg = pieSvg.empty() ? pieDiv.append('svg').attr('class','pie1') : pieSvg;

	//GRID
	let gridDiv = chartDiv.selectAll('div.grid');
	gridDiv = gridDiv.empty() ? chartDiv.append('div').attr('class','grid') : gridDiv;

	let grid = gridDiv.selectAll('div.grid1');
	grid = grid.empty() ? gridDiv.append('div').attr('class','grid1') : grid;


	//draw pie
	let size = Math.min(360, parseInt(pieDiv.style('width'),10)-10);
	pieSvg.attr('width', size).attr('height', size);
	
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


	//draw grid
	var row = grid.selectAll('.row')
		.data(gridData).attr('class',function(d,i){return "row idx"+i;});
	row.select(".col").attr('min-width', '1em').style('min-height', '1em').style('background', function(d,i){return color(i);});
	row.select(".sum").text(function(d,i){return u.curr(d.value.sum);});
	row.select(".title").text(function(d,i){return d.value.name;});
	row.select(".subject").text(function(d,i){return "#"+ d.value.count;});

	row.exit().remove();
	
	var newRow = row.enter().append('div')
		.attr('class',function(d,i){return "row idx"+i;});
	newRow.append("div").attr("class","col").style('min-width', '1em').style('min-height', '1em').style('background', function(d,i){return color(i);});
	newRow.append("div").attr("class","sum").text(function(d,i){return u.curr(d.value.sum);});
	newRow.append("div").attr("class","title").text(function(d,i){return d.value.name;});
	newRow.append("div").attr("class","subject").text(function(d,i){return "#"+ d.value.count;});
	newRow
		.on('mouseover', pieOn)
		.on('mouseout', pieOff)
		.on('mousemove', movegrid)
		.on('click', function(d){
			sv.draw(otag, year, d.value.ico );
		});
	//draw of month will remove suppview
	sv.remove();

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

	grid2.style("transform", "translate(" + (coo[0]+50) + "px," + coo[1] + "px)");
	//title
	var title = grid2.selectAll('.rowtitle').data([1]);
	title.enter().append('div').attr('class', 'rowtitle').attr('colspan',4).merge(title).text(gridData && gridData[0] && gridData[0]["DodavatelNazov"] || "??");

	//inner grid
	var innerGrid = grid2.selectAll('.innergrid').data([1]);
	innerGrid = innerGrid.enter().append('div').attr('class', 'innergrid').merge(innerGrid);

	//header
	var header = innerGrid.selectAll('.header').data([1]);
	header.select(".sum").text("SumaCelkom");
	header.select(".time").text(u.getKeydate());
	header.select(".subject").text("Predmet");
	header.exit().remove();
	var newHeader = header.enter().append('div').attr('class','header');
	newHeader.append("div").attr("class","no").text("#");
	newHeader.append("div").attr("class","sum").text("SumaCelkom");
	newHeader.append("div").attr("class","date").text(u.getKeydate());
	newHeader.append("div").attr("class","subject").text("Predmet");

	//rows
	var row = innerGrid.selectAll('.row').data(gridData);
	row.select(".sum").text(function(d,i){return d["SumaCelkom"];});
	row.select(".date").text(u.dfKd);
	row.select(".subject").text(function(d,i){return d["Predmet"];});
	
	row.exit().remove();
	
	var newRow = row.enter().append('div').attr('class','row');
	newRow.append("div").attr("class","no").text(function(d,i){return "#"+(i+1);});
	newRow.append("div").attr("class","sum").text(function(d,i){return u.curr(d["SumaCelkom"]);});
	newRow.append("div").attr("class","date").text(u.dfKd);
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
