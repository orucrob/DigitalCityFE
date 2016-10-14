import './css/app.scss';
import * as d3 from 'd3';
import * as dataapi from './dataapi';
import * as u from './util';
import * as obec from './obec';
import * as yw from './yearview';
import * as err from './error';



export function init(){
	u.on('dataapierror', function(status, xhr){
		removeAll();
		err.drawError(status, xhr);
	});
	u.on('keydatechange', function(status, xhr){
		drawApp();
	});
	drawApp();
}

function getPageId(otag, year, month){
	if(!otag){
		return 'obec';
	}else {
		return 'fadod';
	}
}


export async function drawApp(otag, year, month){
	otag = otag || u.getHash()['o'];
	year = year || u.getHash()['y'] || new Date().getFullYear();
	month = month || u.getHash()['m'];
	let pageid = getPageId(otag, year, month);
	let keydate = u.getKeydate();

	//skip if already in current state
	if(currentState.o == otag && currentState.y == year && currentState.m == month && currentState.pageid == pageid && currentState.keydate==keydate){
		//nothing to update
	}else{
		if(currentState.pageid != pageid){
			u.removeAll();
		}
		if(pageid == 'obec'){
			await obec.draw();

		}else if(pageid == 'fadod'){
			await yw.draw(otag, year, month);
		}
		//update current state
		currentState = {
			y : year,
			m: month,
			o: otag,
			pageid: pageid,
			keydate: u.getKeydate()
		};
	}
}



