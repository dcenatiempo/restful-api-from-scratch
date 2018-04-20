/*
 * Using the cluster API, it is possible to spread the work of
 * different pars of the app over multiple CPU's
 * 
 * In this example, the background workers and CLI are on one CPU and
 * the HTTP server is duplicated accross the remaining CPU's.
 * 
 * */

// Dependencies
const server  = require('./lib/server');
const workers = require('./lib/workers');
const cli     = require('./lib/cli');
const cluster = require('cluster');
const os      = require('os');

var app = {};

app.init = (callback) => {
  
  if (cluster.isMaster) {
    // This will be run once
    // Automated checks run in the background
    workers.init();
    
    setTimeout( () => {
      cli.init();
      callback();
    }, 50);

    for (let i=0; i<os.cpus().length; i++) {
      // For each CPU, create a new cluster
      // the first cluster is master, subsequent clusters are not
      cluster.fork();
    }

  } else if (os.cpus == 1 || !cluster.isMaster) {
    // If we are not on master, start HTTP server
    // This will be run (the number of CPUs - 1) times or once if only one CPU
    server.init();
  }
};

// Self invoking, only if required directly
if(require.main === module) {
  app.init(() => {});
};

module.exports = app;