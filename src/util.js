import * as d3 from 'd3';

const appSelector = "#app";

export function mf(isoDate){
	return isoDate.substring(5,7);
};
export function curr(number){
	return number.toLocaleString('sk-SK', { style: 'currency', currency: 'EUR' })
};
export function df(d){
	if(!(d instanceof Date)){
		d = new Date(d);
	}
	return dd(d.getDate()) +"."+ dd(d.getMonth()+1) +"." + d.getFullYear();
};

export function dd(n){
	return n>9 ? n : "0"+n; 
};


export function selectRoot(elem, cls){
	var sel = d3.select(appSelector).selectAll(elem+'.'+cls).data([1]);
	sel.exit().remove();
	sel = sel.enter().append(elem).attr('class', cls).merge(sel);
	return sel;

}
export function getAppWidth(){
	return parseInt(d3.select(appSelector).style("width"),10); 
	return 900;
}

export function getWindowHeight(){
	let w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    x = w.innerWidth || e.clientWidth || g.clientWidth,
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
	return y; 
}
export function getHash(){
	var h = window.location.hash;
	var map = {};
	if(h && h.length>0){
		if(h.indexOf("#") == 0){
			h = h.substr(1);
		}
		var parts = h.split('&');
		if(parts && parts.length>0){
			for(var i=0; i<parts.length; i++){
				let pArr = parts[i].split('=');
				if(pArr && pArr.length==2){
					map[pArr[0]] = pArr[1];
				}
			}
		}
	}
	return map;
}
export function saveToHash(key, value){
	let h="",
		map = getHash();
	
	map[key] = value;
	
	for(var k in map){
		h+=(h.length>0 ? "&":"") + k + "=" + map[k];
	}
	window.location.hash = h;
}

