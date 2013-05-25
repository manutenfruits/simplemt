
var url = "https://servicios.emtmadrid.es:8443/geo/servicegeo.asmx/";
var idClient = "WEB.PORTALMOVIL.OTROS";
var passKey = "0810DDE4-02FC-4C0E-A440-1BD171B397C8";
var querystring = require("querystring");
var parseString = require("xml2js").parseString;

exports.getArriveStop= function(req, res){

	var stopId = req.query['stop'];

	var https = require('https');
	var qs = querystring.stringify({
		idClient:idClient,
		passKey:passKey,
		idStop: stopId,
		statistics:"",
		cultureInfo:"es"
	});

	var options = {
		hostname: 'servicios.emtmadrid.es',
		port: 8443,
		path: '/geo/servicegeo.asmx/getArriveStop?'+qs,
		method: 'GET'
	};

	console.log("URL:", options.path);

	var request = https.request(options, function(response) {
		var data = "";
		response.on('data', function(d) {
			data+= d;
		});
		response.on('end', function(){
			parseString(data, function(err, result){
				if(err) console.log("XML error", err);
				else res.end(JSON.stringify(result));
			});
		});
	});
	request.end();

	request.on('error', function(e) {
		console.error(e);
	});

}

exports.getStopsFromXY= function(req, res){

	var coordY = req.query['lat'];
	var coordX = req.query['lng'];
	var radius = req.query['radius'];

	var https = require('https');
	var qs = querystring.stringify({
		idClient:idClient,
		passKey:passKey,
		coordinateX: coordX,
		coordinateY: coordY,
		radius: radius,
		statistics:"",
		cultureInfo:"es"
	});

	var options = {
		hostname: 'servicios.emtmadrid.es',
		port: 8443,
		path: '/geo/servicegeo.asmx/getStopsFromXY?'+qs,
		method: 'GET'
	};

	console.log("URL:", options.path);

	var request = https.request(options, function(response) {
		var data = "";
		response.on('data', function(d) {
			data+= d;
		});
		response.on('end', function(){
			parseString(data, function(err, result){
				if(err) console.log("XML error", err);
				else res.end(JSON.stringify(result));
			});
		});
	});
	request.end();

	request.on('error', function(e) {
		console.error(e);
	});

}