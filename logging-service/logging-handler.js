var _ = require('underscore'),
	config = require('./config'),
	log = require('log4js').getLogger('logging-handler'),
	model = require('./model');

module.exports = function(msg, rinfo) {
	if (msg.length > config.servers.logging.maxPacketBytes) {
		log.warn('Packet length of ' + msg.length + ' too large from ' + rinfo.address);
		return;
	}

	try {
		msg = JSON.parse(msg.toString('utf8'));
	}
	catch (e) {
		log.warn('Invalid JSON packet received from ' + rinfo.address);
		return;
	}

	if (!msg.i) {
		log.warn('Invalid message: no ID.');
		return;
	}

	if (!msg.v) {
		log.warn('Invalid message: no version.');
		return;
	}

	model.saveLogMessage(msg, function(err) {
		if (err) {
			log.error('Failed to log message: ', err);
		}

		log.info('Message from ' + msg.i + '.');
	});
};
