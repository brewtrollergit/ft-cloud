var _ = require('underscore'),
	argv = require('commander'),
	dgram = require('dgram'),
	underscore = require('underscore');

argv
	.usage('<hostname>')
	.option('-p, --port <port number>', 'port [8080]', 8080)
	.option('-6, --ipv6', 'use IPv6 instead of IPv4 [false]')
	.option('-d, --delta-frequency <seconds>', 'delta update frequency [1]', 1)
	.option('-f, --full-frequency <seconds>', 'full update frequency [60]', 60)
	.option('-z, --zones <zone count>', 'number of zones to simulate [8]', 8)
	.parse(process.argv);


if (!argv.args.length) {
	argv.help();
}

var socket = dgram.createSocket(argv.ipv6 ? 'udp6' : 'udp4');

var zoneNames = [
	'Freezer',
	'Chiller',
	'Boiler',
	'Kettle',
	'HLT',
	'MLT',
	'Room',
	'Fermenter 1',
	'Fermenter 2',
	'Fermenter 3',
	'Fermenter 4',
	'Fermenter 5',
	'Fermenter 6',
	'Fermenter 7',
	'Fermenter 8',
	'Fermenter 9',
	'Fermenter 10',
	'Fermenter 11',
	'Fermenter 12',
	'Fermenter 13',
	'Fermenter 14',
	'Fermenter 15',
	'Fermenter 16',
	'Fermenter 17',
	'Fermenter 18',
	'Fermenter 19',
	'Fermenter 20',
	'Fermenter 21',
	'Fermenter 22',
	'Fermenter 23',
	'Fermenter 24',
	'Fermenter 25',
	'Fermenter 26',
	'Fermenter 27',
	'Fermenter 28',
	'Fermenter 29',
	'Fermenter 30',
	'Fermenter 31',
	'Fermenter 32'
];

var state = {
	v : 1,
	i : '3w5e11264sg0g'
};

for (var i = 0; i < argv.zones; i++) {
	var value = {
		n : zoneNames[i],
		p : (Math.random() * 60),
		s : (Math.random() * 60)
	};
	value.o = value.p > value.s ? 1 : value.p < value.s ? 2 : 0;
	state['z' + i] = value;
}

function updateState() {
	_.each(state, function(value, key) {
		if (key === 'v' || key === 'i') {
			return;
		}
		// Give a 0.1% chance of changing the set temperature.
		if (Math.random() < 0.001) {
			value.s = (Math.random() * 60);
		}
		// Move the process temperature towards the set temperature by a bit.
		value.p += value.p < value.s ? 0.01 : -0.01;
		// And reflect the current state of the output.
		value.o = value.p > value.s ? 1 : value.p < value.s ? 2 : 0;
	});
}

function sendDelta() {
	updateState();
	var zone = 'z' + Math.floor(Math.random() * argv.zones);
	var key = pickRandomProperty(state[zone]);
	var delta = {
		v : state.v,
		i : state.i
	};
	delta[zone] = {};
	delta[zone][key] = state[zone][key];
	send(delta);
}

function sendFull() {
	updateState();
	send(state);
}

function send(o) {
	var message = JSON.stringify(o, function(key, value) {
		if (key === 's' || key === 'p') {
			return value.toFixed(2);
		}
		return value;
	});
	console.log(message);
	message = new Buffer(message);
	socket.send(message, 0, message.length, argv.port, argv.args[0]);
}

function pickRandomProperty(obj) {
	var keys = Object.keys(obj);
	return keys[Math.floor(Math.random() * keys.length)];
}

setInterval(sendFull, argv.fullFrequency * 1000);
setInterval(sendDelta, argv.deltaFrequency * 1000);