'use strict';
import * as d3 from 'd3';
import * as u from './util';

//https://itinn.eu/dcapi
//https://service.digitalnemesto.sk/DmApi
const dataapi = {
	faDod: function(oid, year){ return `https://itinn.eu/dcapi/fakturyDodavatelske/${oid}/${year}?format=json`;},
	faDodYears: function(oid){ return `https://itinn.eu/dcapi/GetRok/FDOD/${oid}?format=json`;},
	organizacie: function(){ return `https://itinn.eu/dcapi/organizacie?format=json`;}
}


//invoices (fa) - suppliers (dod);
var faDods = [];
function loadFaDod(orgId, year){
	return new Promise(function(resolve, reject){
		d3.json(dataapi.faDod(orgId, year), function (json) {
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

export async function getFaDod(orgId,year){
	var ret;
	for(var i=0;i<faDods.length;i++){
		if(faDods[i].o == orgId && faDods[i].y == year ){
			ret = faDods[i].data;
			break;
		}
	}
	if(!ret){
		ret = loadFaDod(orgId, year);
		faDods.push({
			o:orgId,
			y:year,
			data: ret
		});
		if(faDods.length>10){
			faDods.shift();
		}
	}
	return await ret;
} 


export async function getFaDodForYearChart(orgId, year){
	let jsonData = await getFaDod(orgId, year);
	if(jsonData){
	    let data = d3.nest()
		    .key(function(d) { return u.ymf(d[u.getKeydate()]);})
		    .sortKeys(d3.ascending)
		    .rollup(function(dd){
				return {
					sum: d3.sum(dd, function(g) { 
			      		return parseFloat(g["SumaCelkom"]);
			 			}),
					count: dd.length,
					detail: dd
				};
			 }).entries(jsonData);

		let keys = data.map(function(v){return v["key"];});
		
		//add empty months
		let missing = u.getMissingMonths(keys);
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
	}else{
		console.log('No data.'); //TODO
		return undefined;
	}
}

//years for org
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
export async function getYears(orgId){
	if(!years[orgId+'']){
		years[orgId+''] = loadYears(orgId);
	}
	return await years[orgId+''];
} 

//obec data
let obecData = undefined;
export async function getObecData(){
	try{
		if(!obecData){
			obecData = loadObecData();
		}
		return await obecData;
	}catch(e){
		//cannot get data
		return undefined;
	}
} 

function loadObecData(){
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
export async function getOrgRec(oTag){
	if(!oTag) return;
	let d = await getObecData();
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

