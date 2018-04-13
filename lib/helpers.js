// Dependencies
const crypto = require('crypto');
const config = require('./config'); //xxx

// Container for all the helpers
var helpers = {}

// Create sha256 hash
helpers.hash = (str) => {
  if (typeof(str) === 'string' && str.length > 0) {
    var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else return false;
}

// Parse to JSON without throwing
helpers.parseJsonToObject = (str) => {
  try {
    var obj = JSON.parse(str)
  } catch(e) {
    return {}
  }
  return obj;
}

// Export Helpers
module.exports = helpers;