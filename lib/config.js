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
  'hashingSecret': 'thisIsASecret'
};

// production environment
environments.production = {
  'httpPort': 5000,
  'httpsPort': 5001,
  'envName': 'production',
  'hashingSecret': 'thisIsAlsoASecret'
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