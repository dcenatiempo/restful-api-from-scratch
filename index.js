// Dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');

var app = {};

app.init = () => {
  server.init();
  workers.init();
  setTimeout( () => {
    cli.init();
  }, 50);
};

app.init();

module.exports = app;