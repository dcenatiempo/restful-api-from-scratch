// Dependencies
const path    = require('path');
const fs      = require('fs');
const _data   = require('./data');
const https   = require('https');
const http    = require('https');
const helpers = require('./helpers');
const url     = require('url');
const _logs   = require('./logs');
const util    = require('util');
const debug   = util.debuglog('workers');

var workers = {};

workers.gatherAllChecks = () => {
  // get all checks
  _data.list('checks', (err, checks) => {
    if(!err && checks && checks.length > 0) {
      checks.forEach( (check) => {
        _data.read('checks', check, (err, originalCheckData) => {
          if(!err && originalCheckData) {
            workers.validateCheckData(originalCheckData);
          } else debug('Error reading one of the checks data');
        });
      });
    } else debug('Error: Could not find any checks to process');
  });
};

workers.validateCheckData = (originalCheckData) => {
  originalCheckData = typeof(originalCheckData) === 'object' && originalCheckData !== null ? originalCheckData : {};

  originalCheckData.id = typeof(originalCheckData.id) === 'string' && originalCheckData.id.trim().length === 20 ? originalCheckData.id.trim() : false;
  if (originalCheckData.id === false) debug('problem with id')

  originalCheckData.userPhone = typeof(originalCheckData.userPhone) === 'string' && originalCheckData.userPhone.trim().length === 10 ? originalCheckData.userPhone.trim() : false;
  if (originalCheckData.userPhone === false) debug('problem with phone')

  originalCheckData.protocol = typeof(originalCheckData.protocol) === 'string' && ['http', 'https'].includes(originalCheckData.protocol) ? originalCheckData.protocol : false;
  if (originalCheckData.protocol === false) debug('problem with protocol')

  originalCheckData.url = typeof(originalCheckData.url) === 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
  if (originalCheckData.url === false) debug('problem with url')

  originalCheckData.method = typeof(originalCheckData.method) === 'string' && ['post', 'get', 'put', 'delete'].includes(originalCheckData.method) ? originalCheckData.method : false;
  if (originalCheckData.method === false) debug('problem with method')

  originalCheckData.successCodes = typeof(originalCheckData.successCodes) === 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
  if (originalCheckData.successCodes === false) debug('problem with codes')

  originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) === 'number' && originalCheckData.timeoutSeconds%1 === 0 && originalCheckData.timeoutSeconds > 0 &&originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false;
  if (originalCheckData.timeoutSeconds === false) debug('problem with timeout')

  // Set new keys
  originalCheckData.state = typeof(originalCheckData.state) === 'string' && ['up', 'down'].includes(originalCheckData.state) ? originalCheckData.state : 'down';

  originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) === 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

  if (originalCheckData.id &&
  originalCheckData.userPhone &&
  originalCheckData.protocol &&
  originalCheckData.url &&
  originalCheckData.method &&
  originalCheckData.successCodes &&
  originalCheckData.timeoutSeconds) {
    workers.performCheck(originalCheckData);
  } else debug('Error: One of the checks is not properly formatted. Skipping');
};

workers.performCheck = (originalCheckData) => {
  var checkOutcome = {
    'error': false,
    'responseCode': false
  };

  var outcomeSent = false;

  var parsedUrl = url.parse(`${originalCheckData.protocol}://${originalCheckData.url}`, true);

  var hostName = parsedUrl.hostname;
  var path = parsedUrl.path; // not pathname because we want querystring

  var requestDetails = {
    'protocol': originalCheckData.protocol+':',
    'hostname': hostName,
    'method': originalCheckData.method.toUpperCase(),
    'path': path,
    'timeout': originalCheckData.timeoutSeconds * 1000
  };

  var _moduleToUse = originalCheckData.protocol === 'http' ? http : https;
  var req = _moduleToUse.request(requestDetails, (res) => {
    var status = res.statusCode;

    checkOutcome.responseCode = status;
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on('error', (err) => {
    checkOutcome.err = {
      'error': true,
      'value': err
    }
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on('timeout', (err) => {
    checkOutcome.err = {
      'error': true,
      'value': 'timeout'
    }
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.end();
};

workers.processCheckOutcome = (originalCheckData, checkOutcome) => {
  // is check up or down?
  var state = !checkOutcome.err && checkOutcome.responseCode &&originalCheckData.successCodes.includes(checkOutcome.responseCode) ? 'up' : 'down';
  // should we alert user?
  var shouldAlert = originalCheckData.lastChecked && originalCheckData.state != state ? true : false;

  // Log the Outcom
  var timeOfCheck = Date.now();
  workers.log(originalCheckData, checkOutcome, state, shouldAlert, timeOfCheck);

  // update check data
  var newCheckData = originalCheckData;
  originalCheckData.state = state;
  originalCheckData.lastChecked = timeOfCheck;

  // save updates
  _data.update('checks', newCheckData.id, newCheckData, (err) => {
    if (!err) {
      if (shouldAlert) {
        workers.alertUserToStatusChange(newCheckData);
      } else debug(`Check ${newCheckData.id} unchanged. ${newCheckData.url} is '${newCheckData.state.toUpperCase()}'!`);
    } else debug(`Error trying to save updated check ${newCheckData.id}`);
  });
};

workers.alertUserToStatusChange = (newCheckData) => {
  var msg = `Alert: Your check for ${newCheckData.method.toUpperCase()} ${newCheckData.protocol}://${newCheckData.url} had changed to ${newCheckData.state}`

  helpers.sendTwilioSms(newCheckData.userPhone, msg, (err) => {
    if(!err) {
      debug('Success: User was alerted to a change in their check');
    } else debug('Error: could not alert user about change in their check');

  })
};

workers.log = (originalCheckData, checkOutcome, state, shouldAlert, timeOfCheck) => {
  var logData = {
    'check': originalCheckData,
    'outcome': checkOutcome,
    'state': state,
    'alert': shouldAlert,
    'time': timeOfCheck
  };

  var logString = JSON.stringify(logData);

  var logFileName = originalCheckData.id;

  _logs.append(logFileName, logString, (err) => {
    if (!err) {
      debug('Logging to file succeeded');
    } else debug('Error: Logging to file failed');
  });
};

workers.loop = () => {
  setInterval( () => {
    workers.gatherAllChecks();
  }, 1000 * 60);
};

workers.rotateLogs = () => {
  _logs.list(false, (err, logs) => {
    if (!err && logs && logs.length > 0) {
      logs.forEach( logName => {
        var logId = logName.replace('.log', '');
        var newFileId = `${logId}-${Date.now()}`;
        _logs.compress(logId, newFileId, (err) => {
          if (!err) {
            _logs.truncate(logId, (err) => {
              if (!err) debug('Success truncating log file');
              else debug('Error truncating logfile');
            });
          } else debug('Error: compressing one of the log files', err);
        });
      });
    } else debug('Error: Could not find any logs to rotate');
  });
};

workers.logRotationLoop = () => {
  setInterval( () => {
    workers.rotateLogs();
  }, 1000 * 60 * 60 * 24);
};

workers.init = () => {
  console.log('\x1b[33m%s\x1b[0m', 'Background workers are running');
  // Execute all checks
  workers.gatherAllChecks();
  // Call a loop to continue checking
  workers.loop();
  // Compress all logs
  workers.rotateLogs();
  workers.logRotationLoop();
};

module.exports = workers;