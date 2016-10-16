import * as d3 from 'd3';
import * as dataapi from './dataapi';
import * as u from './util';
import * as obec from './obec';
import * as mw from './monthview';


const margin = {top: 20, right: 30, bottom: 30, left: 40};
const parseKey = d3.timeParse("%Y%m");
const formatKeyD = d3.timeFormat("%b/%y");
const formatKey = function(v){
	if(v=='999999') return 'No data';
	else return formatKeyD(parseKey(v));
}

export async function draw(otag, year, month,){
	let orgRec = await dataapi.getOrgRec(otag),
		orgId = orgRec && orgRec['OrganizaciaId'];
	
	if(!orgId){
		//not existing org
		u.clearFromHash('o');
	}else{
		let chartData = await dataapi.getFaDodForYearChart(orgId, year);
		if(chartData){
			drawTitle(otag, year, month, orgRec);
			await drawChart(otag, year, month, chartData );
			//TODO be sure, that resize is listented only once
			d3.select(window).on('resize', function(){
				drawChart(otag, year, month, chartData , true, true); //TODO do not animate when resize
			});
		}else{
			console.log('No data');
				//TODO - no data
		}
	}

}


async function drawTitle(otag, year, month, obecRec){
	obecRec = obecRec || {};

	if(currentState.o != otag || currentState.y!=year){

	    //setup title
		var chartTitle = u.selectRoot('div', 'chartTitle')

		var heading = chartTitle.select('.heading');
		heading = heading.empty() ? chartTitle.append('div').attr('class','heading') : heading;
		heading.text("Invoices (suppliers)");

		var name = chartTitle.select('.name');
		name = name.empty() ? chartTitle.append('div').attr('class','name') : name;
		name.html(`OID: ${obecRec["OrganizaciaId"]} Title: <b>${obecRec["Nazov"]}</b> (${obecRec["HashTag"]}): `);
		name.on('click', function(){
			u.fire('obecclick',[]);
			u.clearFromHash('o');
		});


		var yearDiv = chartTitle.select('.year');
		yearDiv = yearDiv.empty() ? chartTitle.append('div').attr('class','year') : yearDiv;
		yearDiv.html(`Year <small>(for 'DatumZverejnenia')</small>: `);


		var yearSel = yearDiv.select('select');
		yearSel = yearSel.empty() ? yearDiv.append('select') : yearSel;
		yearSel.selectAll('option').remove();
		yearSel.append('option').text(''+year);
		yearSel.on('change', function(){
			let newY = parseInt(this.value, 10);
			if(year != newY){
				u.saveToHash('y', newY);
			}
		});

		var keyDateDiv = chartTitle.select('.keydate');
		keyDateDiv = keyDateDiv.empty() ? chartTitle.append('div').attr('class','keydate') : keyDateDiv;
		keyDateDiv.html(`Key Date: `);


		var keyDateSel = keyDateDiv.select('select');
		keyDateSel = keyDateSel.empty() ? keyDateDiv.append('select') : keyDateSel;
		let opts = keyDateSel.selectAll('option').data(['DatumZverejnenia','DatumVystavenia','DatumUhrady', 'DatumSplatnosti', 'DatumDorucenia']);
		opts.exit().remove();
		let currentKeyDate = u.getKeydate();
		opts.enter().append('option').merge(opts).attr('value', function(d){return d;}).text(function(d){return d;}).attr('selected', function(d){ return  currentKeyDate == d ? true : null});
		keyDateSel.on('change', function(){
			u.setKeydate(this.value);
			u.fire('keydatechange', [this.value]);
		});

		//update select with years
		try{
			let years = await dataapi.getYears(obecRec["OrganizaciaId"]);
			let opt = yearSel.selectAll('option').data(years);
			opt.enter().append('option').merge(opt)
				.attr("value", function(d){return d["id"];})
				.text(function(d){return d["rok"]})
				.attr('selected', function(d){ return  year == d["id"] ? true : null});
			opt.exit().remove();
		}catch(e){
			console.log('Error: cannot set years.', e);
		}
	}

}
async function drawChart(otag, year, month, chartData, force, withoutAnimation){
	    let data = chartData.data,
	    	keys = chartData.keys,
	    	keydate = u.getKeydate();

	    if(force || currentState.o != otag || currentState.y!=year || currentState.keydate != keydate){

		    const appWidth = u.getAppWidth();
		    const width = appWidth - margin.left - margin.right;
		    const height = u.getWindowHeight()/2 - margin.top - margin.bottom;
	    	var barWidth = width / data.length;

			var x = d3.scalePoint().domain(keys).rangeRound([0, width]).padding(.5);
	    	var y = d3.scaleLinear()
				.domain([0, d3.max(data, function(g){return g.value.sum;})])
	    		.range([40,height]);

	    	var xAxis = d3.axisBottom(x).tickFormat(formatKey);

		    //setup chart
			var chart = u.selectRoot('svg', 'chart')
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

		   	var rect = withoutAnimation ? bar.select('rect') : bar.select('rect').transition().duration(750);
		   	rect.attr("x", 3)
	 			.attr("y", function(d) { return height - y(d.value.sum); })
	      		.attr("height", function(d) { return y(d.value.sum); })
	      		.attr("width", barWidth - 3);
			
			bar.select("text.label1")
			    .attr("x", barWidth / 2)
			    .attr("y", function(d) { return height - y(d.value.sum) + 3; })
			    .attr("dy", "1em")
			    .html(function(d) { return u.curr(d.value.sum); });
			bar.select("text.label2")
			    .attr("x", barWidth / 2)
			    .attr("y", function(d) { return height - y(d.value.sum) + 20; })
			    .attr("dy", "1em")
			    .html(function(d) { return "#"+d.value.count ; });
		    
		    //create
		    var newBar = bar.enter().append('g').attr('class', 'bar')
		    	.attr("transform", function(d, i) { return "translate(" + i * barWidth + ",0)"; })
		    	.on('click', function(d, idx){
		    		u.saveToHash("m", (idx+1)+"");
		    	});

		    var newRect = newBar
		   		.append("rect")
	 			.attr("x", 3)
	 			.attr("y", function(d) { return height - y(d.value.sum); })
	      		.attr("height", function(d) { return y(d.value.sum); })
	      		.attr("width", barWidth - 3);
	      		
			newBar.append("text").attr('class', 'label1')
			    .attr("x", barWidth / 2)
			    .attr("y", function(d) { return height - y(d.value.sum) + 3; })
			    .attr("dy", "1em")
			    .html(function(d) { return u.curr(d.value.sum); });
			newBar.append("text").attr('class', 'label2')
			    .attr("x", barWidth / 2)
			    .attr("y", function(d) { return height - y(d.value.sum) + 20; })
			    .attr("dy", "1em")
			    .html(function(d) { return "#"+d.value.count ; });

			//remove
			bar.exit().remove();
		}
		
		if(force || currentState.o != otag || currentState.y!=year || currentState.m != month || currentState.keydate != keydate){
	 		if(month && month>0 && month<=data.length){
	 			mw.draw(otag, year, data[month-1], formatKey(keys[month-1]));
	 			//mark selected bar
				d3.selectAll('svg.chart g.bar').classed('selected', function(d, i){return i==(month-1);});

	 		}else{
	 			mw.remove();
	 		}
	 	}
}


