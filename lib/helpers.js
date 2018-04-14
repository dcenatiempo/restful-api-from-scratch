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

// Create a string of random alpha-numeric chars of a specified length
helpers.createRandomString = (strLength) => {
  strLength = typeof(strLength) === 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
    var possibleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var str = '';
    for (let i=0; i<strLength; i++) {
      var randomChar = possibleChars.charAt(Math.floor(Math.random() * (possibleChars.length-1)));
      str += randomChar;
    }
    return str;
  }  else return false;
}

// Export Helpers
module.exports = helpers;