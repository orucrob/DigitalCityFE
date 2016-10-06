'use strict';
import 'babel-polyfill';
import './css/app.scss';
import * as d3 from 'd3';
import  dataapi from './dataapi';
import {mf,df,dd,curr, selectRoot, getAppWidth, getWindowHeight, getHash} from './util';
import * as obec from './obec';
import * as yw from './yearview';


function init(){
	obec.on('select', function(otag){
		obec.removeAll();
		yw.drawApp(otag);
	});
	yw.drawApp();
}


window.onload = init;

