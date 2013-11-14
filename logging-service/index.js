var apiHandler = require('./api-handler'),
	async = require('async'),
	config = require('./config'),
	model = require('./model'),
	dgram = require('dgram'),
	http = require('http'),
	log4js = require('log4js'),
	log = require('log4js').getLogger(),
	loggingHandler = require('./logging-handler'),
	package = require('./package.json');

function configureLogging(callback) {
	log4js.configure(config.log4js);
	setImmediate(callback);
}

function printBanner(callback) {
	log.info();
	var banner = 'ft-cloud API and Logging Server v' + package.version;
	var bannerUnderline = '';
	for (var i = 0; i < banner.length; i++) {
		bannerUnderline += '=';
	}
	log.info(banner);
	log.info(bannerUnderline);
	setImmediate(callback);
}

function startApiListeners(callback) {
	async.each(config.servers.api.listeners, function(config, callback) {
		http.createServer(apiHandler).listen(config.port, function(err) {
			if (err) {
				return callback(err);
			}
			log.info('API server listening on HTTP port ' + config.port);
			return callback();
		});
	}, callback);
}

function startLoggingListeners(callback) {
	async.each(config.servers.logging.listeners, function(config, callback) {
		var socket;
		async.series([
			function(callback) {
				if (config.ipv4) {
					// Listen on IPv4
					socket = dgram.createSocket('udp4', loggingHandler);
					socket.bind(config.port, function(err) {
						if (err) {
							return callback(err);
						}

						log.info('Logging server listening on UDP4 port ' + config.port);
						return callback();
					});
				}
			},
			function(callback) {
				if (config.ipv6) {
					// Listen on IPv6
					socket = dgram.createSocket('udp6', loggingHandler);
					socket.bind(config.port, function(err) {
						if (err) {
							return callback(err);
						}

						log.info('Logging server listening on UDP6 port ' + config.port);
						return callback();
					});
				}
			}
		], callback);
	}, callback);
}

async.series([
	configureLogging,
	printBanner,
	model.initialize,
	startApiListeners,
	startLoggingListeners
], function(err) {
	if (err) {
		throw err;
	}

	log.info('Initialization complete, ready to serve.');
	log.info('----------------------------------------');
	log.info();
});
