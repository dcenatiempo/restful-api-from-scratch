// This is the primary file for the API

// Dependencies
const http          = require('http');
const https         = require('https')
const url           = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config        = require('./config');
const fs            = require('fs');
const handlers      = require('./handlers');
const helpers       = require('./helpers');
const path          = require('path');
const util          = require('util');
const debug         = util.debuglog('server');

var server = {};

// Instantiating the HTTP server
server.httpServer = http.createServer( (req, res) => {
  server.unifiedServer(req, res);
});

// Instantiating the HTTPS server
server.httpsServerOptions = {
  'key': fs.readFileSync(path.join(__dirname, './../https/key.pem')),
  'cert': fs.readFileSync(path.join(__dirname, './../https/cert.pem'))
};
server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
  server.unifiedServer(req, res);
});

server.unifiedServer = (req, res) => {
  var parsedUrl = url.parse(req.url, true);
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/$/g, '');

  var queryStringObject = parsedUrl.query;

  var method = req.method.toLowerCase();

  var headers = req.headers;

  var decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', data => {
    buffer += decoder.write(data);
  });
  req.on('end', () => {
    buffer += decoder.end();
  
    var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

    chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;

    var data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    };

    try {
      chosenHandler(data, (statusCode, payload, contentType) => {
          server.processHandlerResponse(res, method, trimmedPath, statusCode, payload, contentType);
      });
    } catch (err) {
      debug(err);
      server.processHandlerResponse(res, method, trimmedPath, 500, {'Error': 'an unknown error has occured'}, 'json');
    }
  });
};

server.processHandlerResponse = (res, method, trimmedPath, statusCode, payload, contentType) => {
  contentType = typeof(contentType) == 'string' ? contentType : 'json';
  statusCode = typeof(statusCode) === 'number' ? statusCode : 200;
  // Content specific responses
  var payloadString = '';
  if (contentType == 'json') {
    res.setHeader('Content-Type', 'application/json');
    payload = typeof(payload) === 'object' ? payload : {};
    payloadString = JSON.stringify(payload);
  }
  if (contentType == 'html') {
    res.setHeader('Content-Type', 'text/html');
    payloadString = typeof(payload) === 'string' ? payload : '';
  }
  if (contentType == 'favicon') {
    res.setHeader('Content-Type', 'image/x-icon');
    payloadString = typeof(payload) !== 'undefined' ? payload : '';
  }
  if (contentType == 'css') {
    res.setHeader('Content-Type', 'text/css');
    payloadString = typeof(payload) !== 'undefined' ? payload : '';
  }
  if (contentType == 'png') {
    res.setHeader('Content-Type', 'image/png');
    payloadString = typeof(payload) !== 'undefined' ? payload : '';
  }
  if (contentType == 'jpg') {
    res.setHeader('Content-Type', 'image/jpeg');
    payloadString = typeof(payload) !== 'undefined' ? payload : '';
  }
  if (contentType == 'plain') {
    res.setHeader('Content-Type', 'text/plain');
    payloadString = typeof(payload) !== 'undefined' ? payload : '';
  }

  // Content agnostic responses
  res.writeHead(statusCode);
  res.end(payloadString);

  var color;
  if (statusCode === 200) color = '\x1b[30m\x1b[42m%s\x1b[0m'; //green
  else color = '\x1b[41m%s\x1b[0m'; //red

  debug(color, `${method.toUpperCase()} /${trimmedPath} ${statusCode}`);
};

server.router = {
  ''               : handlers.index,
  'account/create' : handlers.accountCreate,
  'account/edit'   : handlers.accountEdit,
  'account/deleted': handlers.accountDeleted,
  'session/create' : handlers.sessionCreate,
  'session/deleted': handlers.sessionDeleted,
  'checks/all'     : handlers.checksList,
  'checks/create'  : handlers.checksCreate,
  'checks/edit'    : handlers.checksEdit,
  'ping'           : handlers.ping,
  'api/users'      : handlers.users,
  'api/tokens'     : handlers.tokens,
  'api/checks'     : handlers.checks,
  'favicon.ico'    : handlers.favicon,
  'public'         : handlers.public,
  'examples/error' : handlers.exampleError
}

server.init = () => {
  // Start the HTTP server
  server.httpServer.listen(config.httpPort, () => {
    console.log('\x1b[35m%s\x1b[0m', `The server is listening on port ${config.httpPort} in ${config.envName} mode`);
  });

  // Start the HTTPS server
  server.httpsServer.listen(config.httpsPort, () => {
    console.log('\x1b[36m%s\x1b[0m', `The server is listening on port ${config.httpsPort} in ${config.envName} mode`);
  });
}

module.exports = server;