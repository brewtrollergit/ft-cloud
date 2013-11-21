var _ = require('underscore'),
	express = require('express'),
	log = require('log4js').getLogger('api-handler'),
	rtmTime = require('rtm-time'),
	model = require('./model');

var app = express();

app.use(express.favicon());
//app.use(express.logger());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.static('public'));
app.use(app.router);
app.use(express.errorHandler());

app.get('/v0/controllers/:id/logs', function(req, res) {
	var id = req.params.id;
	var interval = req.query.interval || '1m';
	var live = req.query.hasOwnProperty('live');
	var start = Number(req.query.start || 0);
	var to = new Date(req.query.to || Date.now());
	var from = new Date(req.query.from || new Date(to.getTime() - rtmTime.parse('1h')).getTime());

	function extend_(memo, o) {
		for (var key in o) {
			if (!o.hasOwnProperty(key)) {
				continue;
			}
			var val = o[key];
			if (typeof val === 'object' && !(val instanceof Date)) {
				if (!memo[key]) {
					memo[key] = {};
				}
				extend_(memo[key], val);
			}
			else {
				memo[key] = val;
			}
		}
	}

	function extend(objects) {
		var memo = {};
		objects.forEach(function(o) {
			extend_(memo, o);
		});
		return memo;
	}

	var map = function() {
		emit(Math.floor(this.createdAt.getTime() / interval), this);
	};

	var reduce = function(key, values) {
		return extend(values);
	};

	model.shortLog.mapReduce(
		map,
		reduce,
		{
			out : { 'inline' : 1 },
			query : {
				i : id,
				createdAt : { $gte : from, $lte : to }
			},
			scope : {
				interval : rtmTime.parse(interval),
				extend : extend,
				extend_ : extend_
			},
			sort : { createdAt : 1 }
		},
		function(err, results) {
			if (err) {
				throw err;
			}
			res.send({
				id : id,
				interval : interval,
				live : live,
				from : from,
				to : to,
				total : results.length,
				start : start,
				count : results.length,
				results : results
			});
		}
	);
});

module.exports = app;