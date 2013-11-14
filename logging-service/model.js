var _ = require('underscore'),
	async = require('async'),
	config = require('./config'),
	log = require('log4js').getLogger(),
	mongodb = require('mongodb').MongoClient,
	rtmTime = require('rtm-time'),
	shortLog,
	longLog;

var shortLogLength = rtmTime.parse(config.db.shortLogLength);
var shortLogRollupFrequency = rtmTime.parse(config.db.shortLogRollupFrequency);
var longLogRollupFrequency = rtmTime.parse(config.db.longLogRollupFrequency);

function ensureShortLogTtlIndex(callback) {
	shortLog.indexes(function(err, indexes) {
		if (err) {
			return callback(err);
		}

		var index = _.findWhere(indexes, { name : 'ttl' });

		if (!index || !index.expireAfterSeconds || index.expireAfterSeconds !== (shortLogLength / 1000)) {
			log.info('shortLog TTL index incorrect, fixing it...');

			var createIndex = function(callback) {
				log.info('  Creating new index...');
				shortLog.ensureIndex({'createdAt' : 1}, { name : 'ttl', background : true, expireAfterSeconds : (shortLogLength / 1000) }, function(err) {
					if (err) {
						return callback(err);
					}

					log.info('  ...done.');
					log.info('...done.');
					return callback();
				});
			};

			if (index) {
				log.info('  Dropping old index...');
				shortLog.dropIndex('ttl', function(err) {
					if (err) {
						return callback(err);
					}
					log.info('  ...done.');
					return createIndex(callback);
				});
			}
			else {
				return createIndex(callback);
			}
		}
		else {
			return callback();
		}
	});
}

function initialize(callback) {
	mongodb.connect(config.db.url, config.db.options, function(err, db) {
		if (err) {
			return callback(err);
		}

		shortLog = db.collection('shortLog');
		longLog = db.collection('longLog');

		async.series([
			ensureShortLogTtlIndex,
			_.bind(shortLog.ensureIndex, shortLog, { i : 1 }),
			_.bind(longLog.ensureIndex, longLog, { i : 1 }),
			_.bind(longLog.ensureIndex, longLog, { createdAt : 1 })
		], callback);
	});
}

/**
 * Set the value at update['path'] to the value at object.path if it
 * exists.
 * For a path like a.b.c this function will set
 * update['a.b.c'] = object.a.b.c if object.a.b.c exists.
 * @param update
 * @param object
 * @param path
 */
function set(update, object, path) {
	var found = _.every(path.split('.'), function(path) {
		if (!object.hasOwnProperty(path)) {
			return false;
		}
		object = object[path];
		return true;
	});
	if (!found) {
		return;
	}
	update[path] = object;
}

/**
 * Save a log message to the database. This function saves the message to the short log,
 * expiring any messages that need to be expired, and also updates or increases the
 * long log.
 * @param message
 * @param callback
 */
function saveLogMessage(message, callback) {
	message.i = message.i.toLowerCase();

	var now = new Date();

	var shortLogRollupDate = new Date(now - shortLogRollupFrequency);
	var longLogRollupDate = new Date(now - longLogRollupFrequency);

	var shortLogQuery = {
		createdAt : { $gte : shortLogRollupDate },
		i : message.i
	};

	var longLogQuery = {
		createdAt : { $gte : longLogRollupDate },
		i : message.i
	};

	var update = {
		$set : {
			updatedAt : now,
			i : message.i,
			v : message.v
		},
		$setOnInsert : { createdAt : now }
	};

	_.each(message, function(value, key) {
		if (/^z\d+$/.test(key)) {
			set(update.$set, message, key + '.n');
			set(update.$set, message, key + '.p');
			set(update.$set, message, key + '.s');
			set(update.$set, message, key + '.o');
		}
	});

	var options = {
		upsert : true
	};

	async.series([
		_.bind(shortLog.update, shortLog, shortLogQuery, update, options),
		_.bind(longLog.update, longLog, longLogQuery, update, options)
	], callback);
}

module.exports = {
	saveLogMessage : saveLogMessage,
	initialize : initialize
};
