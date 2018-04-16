// Dependencies
const crypto      = require('crypto');
const config      = require('./config');
const querystring = require('querystring');
const https       = require('https');
const path        = require('path');
const fs          = require('fs');

// Container for all the helpers
var helpers = {};

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

helpers.sendTwilioSms = (phone, message, callback) => {
  phone = typeof(phone) === 'string' && phone.trim().length === 10 ? phone.trim() : false;

  message = typeof(message) === 'string' && message.trim().length > 0 && message.trim().length <= 1600 ? message.trim() : false;

  if (phone && message) {
    var payload = {
      'From': config.twilio.fromPhone,
      'To': `+1${phone}`,
      'Body': message
    };

    var stringPayload = querystring.stringify(payload);

    var requestDetails = {
      'protocol': 'https:',
      'hostname': 'api.twilio.com',
      'method': 'POST',
      'path': `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
      'auth': `${config.twilio.accountSid}:${config.twilio.authToken}`,
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    };

    var req = https.request(requestDetails, (res) => {
      var status = res.statusCode;
      if (status === 200 || status === 201) callback(false);
      else callback(`Status code returned was ${status}`);
    });

    req.on('error', (e) => {
      callback(e);
    });

    req.write(stringPayload);

    req.end();

  } else callback ( 'Parameters are missing or invalid');
};

helpers.getTemplate = (templateName, data, callback) => {
  templateName === typeof(templateName) === 'string' && templateName.length > 0 ? templateName : false;

  data = typeof(data) == 'object' && data != null ? data : {};

  if (templateName) {
    var templateDir = path.join(__dirname, './../templates/');
    fs.readFile(templateDir + templateName + '.html', 'utf8', (err, str) => {
      if (!err && str && str.length > 0) {
        var interpolatedString = helpers.interpolate(str, data);
        callback(false, interpolatedString);
      } else callback('No template could be found');
    });
  } else callback('A valid template name was not given');
};

// Add header.html and footer.html to index.html
helpers.addUniversalTemplates = (str, data, callback) => {
  str = typeof(str) == 'string' && str.length > 0 ? str : '';
  data = typeof(data) == 'object' && data != null ? data : {};

  helpers.getTemplate('_header', data, (err, headerString) => {
    if (!err && headerString) {
      helpers.getTemplate('_footer', data, (err, footerString) => {
        if (!err && headerString) {
          var fullString = headerString + str + footerString;
          callback(false, fullString);
        } else callback('Error: could not find footer template');
      });
    } else callback('Error: could not find header template');
  });
};

// replace {vars} in with associate values in config.templateGlobals
helpers.interpolate = (str, data) => {
  str = typeof(str) == 'string' && str.length > 0 ? str : '';
  data = typeof(data) == 'object' && data != null ? data : {};
  // Add globals to data object
  for (let key in config.templateGlobals) {
    if (!(key in data)) {
      data[`global.${key}`] = config.templateGlobals[key];
    }
  }

  for(let key in data) {
    var replace = data[key];
    var find = `{${key}}`;
    str = str.replace(find, replace);
  }

  return str;
}

// Export Helpers
module.exports = helpers;