var express = require('express');

var app = express();

app.use(express.favicon());
app.use(express.logger());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.errorHandler());

app.get('/', function(req, res) {
	res.send({hi:false});
});

module.exports = app;