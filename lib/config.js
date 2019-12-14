/*
 * Create and export configuration variables
 *
 */

//Dependencies
const path = require('path');

// Container for all environments
let environments = {};

let baseDir = path.join(__dirname, '/..');
let errorLog = path.join(__dirname, '/../.logs/errorLog.log');

// Staging (default) environment
environments.staging = {
  'httpPort' : 3000,
  'httpsPort' : 3001,
  'envName' : 'staging',
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
    'baseUrl' : 'http://localhost:3000/'
  },
  debugMode: true,
  rotateLogs: false,
  baseDir: baseDir,
  errorLog: errorLog
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
  },
  debugMode: true,
  rotateLogs: false,
  baseDir: baseDir,
  errorLog: errorLog
};

// Production environment
environments.production = {
  'httpPort' : process.env.PORT,
  // 'httpsPort' : 5001,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAlsoASecret',
  'maxChecks' : 10,
  'twilio' : {
    'accountSid' : '',
    'authToken' : '',
    'fromPhone' : ''
  },
  'templateGlobals' : {
    'appName' : 'UptimeChecker',
    'companyName' : 'NotARealCompany, Inc.',
    'yearCreated' : '2018',
    'baseUrl' : 'http://localhost:5000/'
  },
  debugMode: false,
  rotateLogs: true,
  baseDir: baseDir,
  errorLog: path.join(__dirname, '/../.logs/errorLog.log')
};

let paths = {
  _checks: path.join(baseDir, '/lib/handlers/_checks.js'),
  _tokens: path.join(baseDir, '/lib/handlers/_tokens.js'),
  _users: path.join(baseDir, '/lib/handlers/_users.js'),
  gf: path.join(baseDir, '/lib/gf.js'),
  handlers: path.join(baseDir, '/lib/handlers.js'),
  to: path.join(baseDir, '/lib/to.js'),
  validator: path.join(baseDir, '/lib/validator.js')
};
environments.staging.paths = paths;
environments.testing.paths = paths;
environments.production.paths = paths;


// Determine which environment was passed as a command-line argument
let currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not default to staging
let environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;
