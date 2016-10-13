import * as d3 from 'd3';
import  dataapi from './dataapi';
import {saveToHash, selectRoot, fire} from './util';


let data = undefined;

export async function draw(){
	let d = await getData();
	if(d && d.length>0){
		drawSerchBox(d);
		drawTable(d);
	}else{
		//TODO no data
	}
}

export async function getData(){
	try{
		if(!data){
			data = loadData();
		}
		return await data;
	}catch(e){
		//cannot get data
		return undefined;
	}
} 

function loadData(){
	return new Promise(function(resolve, reject){
		d3.json(dataapi.organizacie(), function (json) {
		    if(!json){
		    	reject(json);
		    }else{
			    resolve(json.Data);
		    }
		}).on('error', function(ev){
			let xhr = ev.srcElement,
				status = xhr.status;
			fire('dataapierror', [status, xhr]);
		});
	});
}
function drawSerchBox(data){
	data = data || [];
	let searchBox = selectRoot('div', 'obecsearch');
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
		grid = grid || selectRoot('div', 'obecgrid');
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
		fire('obecselect', [hash]);
		saveToHash('o', hash);
	}
}
export function drawTable(data){
	
	data.sort(function(a, b){ return d3.ascending(a["Nazov"], b["Nazov"]); });

	let grid = selectRoot('div', 'obecgrid');
	grid.style('border', '1px solid black');
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
	d3.select('div.obecgrid').remove();
	d3.select('div.obecsearch').remove();
}



export async function getOrgRec(oTag){
	if(!oTag) return;
	let d = await getData();
	let ret;

	if(d){
		for(let i = 0; i<d.length ; i++){
			if(d[i]["HashTag"] == oTag){
				ret = d[i];
				break;
			}
		}
	}

	return ret;
}

