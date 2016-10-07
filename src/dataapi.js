'use strict';

//https://itinn.eu/dcapi
//https://service.digitalnemesto.sk/DmApi
const dataapi = {
	faDod: function(oid, year){ return `https://itinn.eu/dcapi/fakturyDodavatelske/${oid}/${year}?format=json`;},
	faDodYears: function(oid){ return `https://itinn.eu/dcapi/GetRok/FDOD/${oid}?format=json`;},
	organizacie: function(){ return `https://itinn.eu/dcapi/organizacie?format=json`;}
}

export default  dataapi