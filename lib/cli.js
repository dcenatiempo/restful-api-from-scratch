// Dependencies
const readline     = require('readline');
const os           = require('os');
const v8           = require('v8');
const _data        = require('./data');
const _logs        = require('./logs');
const helpers      = require('./helpers');
const util         = require('util');
const debug        = util.debuglog('cli');
const events       = require('events');
const childProcess = require('child_process');
class _events extends events{};
const e        = new _events();

var cli = {};

// Input Handlers
e.on('man', (str) => {
  cli.responders.help();
});

e.on('help', (str) => {
  cli.responders.help();
});

e.on('exit', (str) => {
  cli.responders.exit();
});

e.on('stats', (str) => {
  cli.responders.stats();
});

e.on('list users', (str) => {
  cli.responders.listUsers();
});

e.on('more user info', (str) => {
  cli.responders.moreUserInfo(str);
});

e.on('list checks', (str) => {
  cli.responders.listChecks(str);
});

e.on('more check info', (str) => {
  cli.responders.moreCheckInfo(str);
});

e.on('list logs', (str) => {
  cli.responders.listLogs();
});

e.on('more log info', (str) => {
  cli.responders.moreLogInfo(str);
});

// Responders
cli.responders = {};

cli.responders.help = () => {
  var commands = {
    'exit' : 'Kill the CLI (and the rest of the application)',
    'man' : 'Show this help page',
    'help' : 'Alias of the "man" command',
    'stats' : 'Get statistics on the underlying operating system and resource utilization',
    'List users' : 'Show a list of all the registered (undeleted) users in the system',
    'More user info --{userId}' : 'Show details of a specified user',
    'List checks --up --down' : 'Show a list of all the active checks in the system, including their state. The "--up" and "--down flags are both optional."',
    'More check info --{checkId}' : 'Show details of a specified check',
    'List logs' : 'Show a list of all the log files available to be read (compressed only)',
    'More log info --{logFileName}' : 'Show details of a specified log file',
  };

  cli.printHeader('CLI MANUAL');
  cli.printContent(commands);
  cli.printFooter();
};

cli.responders.exit = () => {
  console.log("Shutting down server");
  process.exit(0);
}

cli.responders.stats = () => {
  var loadAve = os.loadavg()
    .reduce( (str, num, i) => {
      var map = ['1 min ave: ', ',  5 min ave: ', ',  15 min ave: '];
      return str + map[i] + Math.round(num*1000)/1000 },'')

  var stats = {
    'Load Average'               : loadAve,
    'CPU Count'                  : os.cpus().length + ` CPU's`,
    'Free Memory'                : os.freemem()/1000000000 + ' Gigabytes',
    'Current Malloced Memory'    : v8.getHeapStatistics().malloced_memory/1000 + ' Kilobytes',
    'Peak Malloced Memory'       : v8.getHeapStatistics().peak_malloced_memory/1000 + ' Kilobytes',
    '% Allocated Heap Used'      : Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100) + '%',
    '% Available Heap Allocated' : Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100) + '%',
    'Uptime'                     : cli.getLongTime(os.uptime())
  };

  cli.printHeader('SYSTEM STATISTICS');
  cli.printContent(stats);
  cli.printFooter();
}

cli.responders.listUsers = () => {
  _data.list('users', (err, userIds) => {
    if (!err && userIds.length > 0) {
      cli.verticalSpace(1);
      userIds.forEach( id => {
        _data.read('users', id, (err, userData) => {
          if (!err &&  userData) {
            var numOfChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array && userData.checks.length > 0 ? userData.checks.length : 0;
            var fullName = userData.firstName + ' '+ userData.lastName;
            fullName = fullName.length <= 15 ? fullName : fullName.substring(0, 12) + '...'; 
            var spaces = 15 - fullName.length;
            var line = `${fullName} ${(' ').repeat(spaces)} Phone: ${userData.phone}  Checks: ${numOfChecks}`;
            console.log(line);
            cli.verticalSpace(1);
          }
        });
      });
    }
  });
};

cli.responders.moreUserInfo = (str) => {
  var array = str.split('--');
  if (array[1]) {
    var userId = array[1]
    userId = userId.trim().length == 10 ? userId : false;
    if (userId) {
      _data.read('users', userId, (err, userData) => {
        if (!err && userData) {
          delete userData.hashedPassword;
          cli.verticalSpace(1);
          console.dir(userData, {'colors': true});
          cli.verticalSpace(1);
        } else console.log('User Id does not exist.\n');
      });
    } else console.log('User Id must be a 10 digit phone number.\n');
  } else console.log(`Must include '--' flag followed by a 10 user id`)
}

cli.responders.listChecks = (str) => {
  _data.list('checks', (err, userIds) => {
    if (!err && userIds.length > 0) {
      cli.verticalSpace(1);
      userIds.forEach( id => {
        _data.read('checks', id, (err, checkData) => {
          if (!err &&  checkData) {
            var includeCheck = false;
            var lowerString = str.toLowerCase();
            // Get the state, default to down
            var state = typeof(checkData.state) == 'string' ? checkData.state : 'down';
            // Get the state, default to unknown
            var stateOrUnknown = typeof(checkData.state) == 'string' ? checkData.state : 'unknown';
            // If the user has specified that state, or hasn't specified any state
            if ((lowerString.indexOf('--'+state) > -1) || (lowerString.indexOf('--down') == -1 && lowerString.indexOf('--up') == -1)) {
              var state = stateOrUnknown === 'up'
                ? `\x1b[32m${stateOrUnknown}\x1b[0m`
                : `\x1b[31m${stateOrUnknown}\x1b[0m`;

              var line = `ID: ${checkData.id}  ${checkData.method.toUpperCase()} ${checkData.protocol}://${checkData.url}  State: ${state}`;
              console.log(line);
              cli.verticalSpace();
            }
          }
        });
      });
    }
  });
}

cli.responders.moreCheckInfo = (str) => {
  var array = str.split('--');
  if (array[1]) {
    var checkId = array[1];
    checkId = checkId && checkId.trim().length == 20 ? checkId : false;
    if (checkId) {
      _data.read('checks', checkId, (err, checkData) => {
        if (!err && checkData) {
          cli.verticalSpace(1);
          console.dir(checkData, {'colors': true});
          cli.verticalSpace(1);
        } else console.log('Check Id does not exist.\n');
      });
    } else console.log('Check Id must be a 20 character id.\n');
  } else console.log(`Must include '--' flag followed by a 20 character id`)
}

// This uses a command from the shell (ls) instead of using fs
cli.responders.listLogs = () => {
  var ls = childProcess.spawn('ls', ['./.logs/']);
  ls.stdout.on('data', (dataObject) => {
    var logFileNames = dataObject
      .toString()
      .split('\n');
    cli.verticalSpace();
    logFileNames.forEach( fileName => {
      if (typeof(fileName) == 'string' && fileName.length>0 && fileName.includes('-')) {
        console.log(fileName.split('.')[0]);
        cli.verticalSpace;
      }
    });
  })
};

// This has been refactored above ^
// cli.responders.listLogs = () => {
//   _logs.list(true, (err, logFileNames) => {
//     if (!err && logFileNames) {
//       cli.verticalSpace();
//       logFileNames.forEach( fileName => {
//         if (fileName.includes('-')) {
//           console.log(fileName);
//           cli.verticalSpace;
//         }
//       });
//     }
//   })
// }

cli.responders.moreLogInfo = (str) => {
  var array = str.split('--');
  if (array[1]) {
    var logFileName = array[1];
    logFileName = logFileName && logFileName.trim().length == 34 ? logFileName : false;
    if (logFileName) {
      cli.verticalSpace(1);
      _logs.decompress(logFileName, (err, stringData) => {
        if (!err && stringData) {
          stringData.split('\n').forEach(jsonString => {
            var logObject = helpers.parseJsonToObject(jsonString);
            if (logObject && JSON.stringify(logObject) != '{}') {
              console.dir(logObject, {'colors': true});
              cli.verticalSpace(1);
            }
          })
        } else console.log(err);
      });
    } else console.log('Log file does not exist.\n');
  } else console.log(`Must include '--' flag followed by a the fileName`)
}

cli.processInput = (str) => {
  str = typeof(str) == 'string' && str.trim().length > 0 ? str : false;
  if (str) {
    var uniqueInputs = [
      'man',
      'help',
      'exit',
      'stats',
      'list users',
      'list checks',
      'list logs',
      'more user info',
      'more check info',
      'more log info'
    ];
    var command = uniqueInputs.reduce( (result, input, index) => {
      if (str.toLowerCase().indexOf(input) === 0) {
        return input;
      }
      return result
    }, null);
    if (command) {
      e.emit(command, str);
    } else {
      console.log("Sorry, try again");
    }
  }
};

// Create a vertical space
cli.verticalSpace = function(lines){
  lines = typeof(lines) == 'number' && lines > 0 ? lines : 1;
  for (i = 0; i < lines; i++) {
      console.log('');
  }
};

// Create a horizontal line across the screen
cli.horizontalLine = function(){
  var width = process.stdout.columns;

  // Put in enough dashes to go across the screen
  var line = '';
  for (let i = 0; i < width; i++) {
      line += '-';
  }
  console.log(line);
};

// Create centered text on the screen
cli.centered = function(str){
  str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : '';

  var width = process.stdout.columns;

  var leftPadding = Math.floor((width - str.length) / 2);

  var line = '';
  for (let i = 0; i < leftPadding; i++) {
    line+=' ';
  }
  line+= str;
  console.log(line);
};

cli.printHeader = (text) => {
  cli.verticalSpace(1);
  cli.horizontalLine();
  cli.centered(text);
  cli.horizontalLine();
  cli.verticalSpace(2);
}

cli.printContent = (object) => {
  for(let key in object){
    if(object.hasOwnProperty(key)){
       let value = object[key];
       let line = '  \x1b[33m '+key+' \x1b[0m';
       let padding = 40 - line.length;
       for (let i = 0; i < padding; i++) {
           line += ' ';
       }
       line += value;
       console.log(line);
       cli.verticalSpace();
    }
  }
};

cli.printFooter = () => {
  cli.verticalSpace(1);
  cli.horizontalLine();
  cli.verticalSpace(1);
}

cli.getLongTime = (seconds) => {
  var days = Math.floor(seconds / (60 * 60 * 24));
  seconds = seconds - (days * 60 * 60 * 24);
  var hours = Math.floor(seconds / (60 * 60));
  seconds = seconds - (hours * 60 * 60);
  var minutes = Math.floor(seconds / 60);
  seconds = seconds - (minutes * 60);
  seconds = Math.floor(seconds);

  days = days > 0 ? days + ' days, ' : '';
  hours = hours > 0 || days ? hours + ' hours, ' : '';
  minutes = minutes > 0 || hours ? minutes + ' minutes, ' : '';
  seconds = seconds + ' seconds'
  
  return days + hours + minutes + seconds;
}

cli.init = () => {
  console.log('\x1b[34m%s\x1b[0m', `The CLI is listening running`);

  // Start the interface
  // NOTE: The REPL module would be easier to use here, but they I wouldn't
  //       get the opportunity to take a deeper dive into Node!
  var _interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '>'
  });

  // Initial Prompt
  _interface.prompt;

  _interface.on('line', (str) => {
    cli.processInput(str);
    _interface.prompt;
  });

  _interface.on('close', () => {
    process.exit(0);
  });
};


module.exports = cli;
