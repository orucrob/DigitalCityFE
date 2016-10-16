import './css/obec.scss';
import * as d3 from 'd3';
import * as dataapi from './dataapi';
import * as u from './util';


export async function draw(){
	let d = await dataapi.getObecData();
	if(d && d.length>0){
		drawTitle();
		drawSerchBox(d);
		drawTable(d);
	}else{
		console.log('No data.');
		//TODO no data
	}
}

function drawTitle(){
	u.selectOrCreate('div.obec','div.heading').text("Select City");
}

function drawSerchBox(data){
	data = data || [];
	let searchBox = u.selectOrCreate('div.obec','div.search');
	var inp = searchBox.select('input');
	if(inp.empty()){
		inp = searchBox.append('input').attr('type', 'search').attr('placeholder','Search...');
		inp.on('input', function(){
			let filtData = data,
				val = this.value;

			if(val && val.length>0){
				filtData = data.filter(function(el, idx){
					return (el["HashTag"].indexOf(val)>-1 || el["Nazov"].indexOf(val)>-1 || (el["OrganizaciaId"]+'').indexOf(val)>-1)
				});
			}
			drawTable(filtData);
		}).on('keydown', function(){
			handleKeyDown(d3.event.keyCode);
		});
	}
	inp.node().focus();

}
function handleKeyDown(code, grid){
	if( code == 38 || code == 40){
		grid = grid || u.selectOrCreate('div.obec','div.obecgrid');
		let idx = 0;
		let current = grid.selectAll('.row.selected');
		if(!current.empty()){
			if(code == 38){
				idx = +current.attr('data-idx') - 1;
				if(idx<0) idx = 0;
			}else{
				idx = +current.attr('data-idx') + 1;
				let maxId = grid.selectAll('.row').size()-1;
				if(idx > maxId) idx = maxId;
			}
		}
		current.classed('selected',false);
		grid.selectAll(`.row[data-idx="${idx}"]`).classed('selected',true).node().focus();
	}else if (code == 13){
		selectObec();

	}

}
function selectObec(){
	let current = d3.selectAll('div.obecgrid .row.selected');
	if(!current.empty()){
		var hash = current.attr('data-id');
		u.fire('obecselect', [hash]);
		u.saveToHash('o', hash);
	}
}
export function drawTable(data){
	
	data.sort(function(a, b){ return d3.ascending(a["Nazov"], b["Nazov"]); });

	let grid = u.selectOrCreate('div.obec','div.obecgrid');
//	grid.style('border', '1px solid black');
	grid.on('keydown', function(){
		handleKeyDown(d3.event.keyCode, grid);
	}).on('click', selectObec);

	var row = grid.selectAll('.row').data(data)
		.attr('tabindex',function(d,i){return i;})
		.attr('data-id',function(d,i){return d["HashTag"];})
		.attr('data-idx',function(d,i){return i;});
	row.select(".id").text(function(d,i){return d["OrganizaciaId"];});
	row.select(".hashtag").text(function(d,i){return d["HashTag"];});
	row.select(".title").text(function(d,i){return d["Nazov"];});
	row.select(".titleObec").text(function(d,i){return d["NazovObec"];});

	row.exit().remove();
	
	var newRow = row.enter().append('div')
		.attr('class',"row")
		.attr('tabindex',function(d,i){return i;})
		.attr('data-id',function(d,i){return d["HashTag"];})
		.attr('data-idx',function(d,i){return i;});
	newRow.append("div").attr("class","id").text(function(d,i){return d["OrganizaciaId"];});
	newRow.append("div").attr("class","hashtag").text(function(d,i){return d["HashTag"];});
	newRow.append("div").attr("class","title").text(function(d,i){return d["Nazov"];});
	newRow.append("div").attr("class","titleObec").text(function(d,i){return d["NazovObec"];});

	newRow.on('mouseover', function(){
		grid.selectAll('.row.selected').classed('selected',false);
		d3.select(this).classed('selected', true);
	});


}

export function removeAll(){
	d3.select('div.obec').remove();
}




