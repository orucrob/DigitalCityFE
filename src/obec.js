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
		    	console.log('noJson',arguments);
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
		});
	}

}
export function drawTable(data){
	
	data.sort(function(a, b){ return d3.ascending(a["Nazov"], b["Nazov"]); });

	let grid = selectRoot('div', 'obecgrid');
	grid.style('border', '1px solid black');

	var row = grid.selectAll('.row').data(data).attr('data-id',function(d,i){return d["OrganizaciaId"];});
	row.select(".id").text(function(d,i){return d["OrganizaciaId"];});
	row.select(".hashtag").text(function(d,i){return d["HashTag"];});
	row.select(".title").text(function(d,i){return d["Nazov"];});
	row.select(".titleObec").text(function(d,i){return d["NazovObec"];});

	row.exit().remove();
	
	var newRow = row.enter().append('div').attr('class',function(d,i){return "row idx"+i;});
	newRow.append("div").attr("class","id").text(function(d,i){return d["OrganizaciaId"];});
	newRow.append("div").attr("class","hashtag").text(function(d,i){return d["HashTag"];});
	newRow.append("div").attr("class","title").text(function(d,i){return d["Nazov"];});
	newRow.append("div").attr("class","titleObec").text(function(d,i){return d["NazovObec"];});

	newRow.on('click', function(d,i){
		saveToHash('o', d["HashTag"]);
		fire('obecselect', [d["HashTag"], d]);
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

