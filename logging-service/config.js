var fs = require('fs');

module.exports = JSON.parse(fs.readFileSync('./config/defaults.json'));