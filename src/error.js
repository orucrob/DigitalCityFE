import * as d3 from 'd3';
import {selectRoot}  from './util';

export function drawError(status, xhr){
	let err = selectRoot('div', 'error');
	var msg = err.selectAll('div.message').data([1]);
	msg.exit().remove();
	msg.enter().append('div').attr('class','message').merge(msg).text(`Problem accessing data api. Server status: ${status}`);
	
	var api = "https://service.digimesto.sk/DmApi/";
	var msg2 = err.selectAll('div.messagedetail').data([1]);
	msg2.exit().remove();

	msg2.enter().append('div').attr('class','messagedetail').merge(msg).html(`We are using data from: <a href="${api}">${api}</a>. <br/>(We are routing this API through itinn.eu, because of wrong CORS handling.)`);

	
}