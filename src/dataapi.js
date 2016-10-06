'use strict';

//let urlDF = "https://service.digimesto.sk/DmApi/fakturyDodavatelske/148/2016?format=json";

const dataapi = {
	faDod: function(oid, year){ return `https://itinn.eu/dcapi/fakturyDodavatelske/${oid}/${year}?format=json`;},
	organizacie: function(){ return `https://itinn.eu/dcapi/organizacie?format=json`;}
}

export default  dataapi