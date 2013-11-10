var config = require('./config');

module.exports = function(msg, rinfo) {
	if (msg.length > config.servers.logging.maxPacketBytes) {
		console.log('Packet length of ' + msg.length + ' too large from ' + rinfo.address);
		return;
	}

	try {
		msg = JSON.parse(msg.toString('utf8'));
	}
	catch (e) {
		console.log('Invalid JSON packet received from ' + rinfo.address);
		return;
	}



	console.dir(msg);
};
