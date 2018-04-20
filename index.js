// Dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');

var app = {};

app.init = (callback) => {
  server.init();
  workers.init();
  setTimeout( () => {
    cli.init();
    callback();
  }, 50);
};

// Self invoking, only if required directly
if(require.main === module) {
  app.init(() => {});
};

module.exports = app;