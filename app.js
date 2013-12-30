
/**
 * Module dependencies.
 */

var express = require('express')
	, routes = require('./routes/api')
	, http = require('http')
	, path = require('path');

var app = express();
var server = http.createServer(app);

app.configure(function(){
	app.set('ipaddress', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");
	app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

app.get('/api/getArriveStop', routes.getArriveStop);
app.get('/api/getStopsFromXY', routes.getStopsFromXY);

server.listen(app.get('port'), app.get('ipaddress'), function(){
	console.log("Express server listening on port " + app.get('port'));
});
