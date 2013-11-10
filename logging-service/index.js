var apiHandler = require('./api-handler'),
	config = require('./config'),
	dgram = require('dgram'),
	http = require('http'),
	loggingHandler = require('./logging-handler');

// Start the API servers.
config.servers.api.listeners.forEach(function(config) {
	http.createServer(apiHandler).listen(config.port, function() {
		console.log('API server listening on HTTP port ' + config.port);
	});
});

// Start the Logging servers.
config.servers.logging.listeners.forEach(function(config) {
	var socket;
	// Listen on IPv4
	socket = dgram.createSocket('udp4', loggingHandler);
	socket.bind(config.port, function(err) {
		if (err) {
			throw err;
		}

		console.log('Logging server listening on UDP4 port ' + config.port);
	});

	// Listen on IPv6
	socket = dgram.createSocket('udp6', loggingHandler);
	socket.bind(config.port, function(err) {
		if (err) {
			throw err;
		}

		console.log('Logging server listening on UDP6 port ' + config.port);
	});
});

