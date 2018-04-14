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

    var data = {
      'trimmed path': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    };

    chosenHandler(data, (statusCode, payload) => {
      statusCode = typeof(statusCode) === 'number' ? statusCode : 200;
      payload = typeof(payload) === 'object' ? payload : {};
      var payloadString = JSON.stringify(payload);
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(`${payloadString}\n`);

      if (statusCode === 200) color = '\x1b[30m\x1b[42m%s\x1b[0m'; //green
      else color = '\x1b[41m%s\x1b[0m'; //red

      debug(color, `${method.toUpperCase()} /${trimmedPath} ${statusCode}`);
    });

  });
  debug(headers);
};

server.router = {
  'ping': handlers.ping,
  'users': handlers.users,
  'tokens': handlers.tokens,
  'checks': handlers.checks
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