'use strict';
import 'babel-polyfill';
import * as app from './app';

window.currentState = {
	o:undefined,
	y:undefined,
	m:undefined,
	pageid: undefined,
	keydate: undefined
};



window.onload = app.init;
window.addEventListener('popstate', function(event) {
	app.drawApp();
});

