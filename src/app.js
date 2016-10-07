'use strict';
import 'babel-polyfill';
import './css/app.scss';
import * as d3 from 'd3';
import  dataapi from './dataapi';
import {removeAll, on} from './util';
import * as obec from './obec';
import * as yw from './yearview';
import * as err from './error';


function init(){
	on('dataapierror', function(status, xhr){
		removeAll();
		err.drawError(status, xhr);
	});
	on('obecselect', function(otag){
		obec.removeAll();
		yw.drawApp(otag);
	});
	yw.drawApp();
}


window.onload = init;

