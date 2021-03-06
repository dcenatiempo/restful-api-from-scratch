/* 
 * Create and export config vars
 * 
 * */

// container for all environments
var environments = {};

// staging (default) environment
environments.staging = {
  'httpPort': 3000,
  'httpsPort': 3001,
  'envName': 'staging',
  'hashingSecret': 'thisIsASecret',
  'maxChecks': 5,
  'twilio' : {
    'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhone' : '+15005550006'
  },
  'templateGlobals': {
    'appName': 'UptimeChecker',
    'companyName': 'My Company',
    'yearCreated': '2018',
    'baseUrl': 'http://localhost:3000/'
  }

  // 'twilio': {
  //   'accountSid': 'ACdd6c3e7d6114055a953ae33b935e3b24',
  //   'authToken': '0ef14009f20bb7b10c10530efefb030b',
  //   'fromPhone': '+14802771160'
  // }
};

// production environment
environments.production = {
  'httpPort': 5000,
  'httpsPort': 5001,
  'envName': 'production',
  'hashingSecret': 'thisIsAlsoASecret',
  'maxChecks': 5,
  // twilio
  'templateGlobals': {
    'appName': 'UptimeChecker',
    'companyName': 'My Company',
    'yearCreated': '2018',
    'baseUrl': 'http://localhost:5000/'
  }
};

// Testing environment
environments.testing = {
  'httpPort' : 4000,
  'httpsPort' : 4001,
  'envName' : 'testing',
  'hashingSecret' : 'thisIsASecret',
  'maxChecks' : 5,
  'twilio' : {
    'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhone' : '+15005550006'
  },
  'templateGlobals' : {
    'appName' : 'UptimeChecker',
    'companyName' : 'NotARealCompany, Inc.',
    'yearCreated' : '2018',
    'baseUrl' : 'http://localhost:4000/'
  }
};

// determine which environment to export
var currentEnvironment = typeof(process.env.NODE_ENV) === 'string'
  ? process.env.NODE_ENV.toLowerCase()
  : '';

// check to see if environment is a valid value
var environmentToExport = typeof(environments[currentEnvironment]) === 'object'
  ? environments[currentEnvironment]
  : environments.staging;


// export this module
module.exports = environmentToExport;