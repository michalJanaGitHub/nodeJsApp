/*
 * Request Handlers
 *
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');
const to = require('./to.js');
const validate = require('./validator');
const resO = require(config.paths.gf).resO;


// Define all the handlers
let handlers = {};

/*
 * HTML Handlers
 *
 */

async function getTemplateString(data, templateData) {
  // Reject anything that is not get
  if (data.method !== 'get') { callback(405, undefined, 'html'); return; }
  let err, str;
  // Read in a template as a string
  [err, str] = await to(helpers.getTemplateA(templateData.templateName));

  // Add the universal header and footer
  [err, str] = await to(helpers.addUniversalTemplatesA(str, templateData));
  if (err) return (resO(500, undefined, 'html'));
  return (resO(200, str, 'html'));
}

handlers.serveSimpleTemplate = async (data, callback) => {
  let templateData = {};
  switch (data.trimmedPath) {
    case '':            //index
      templateData = {
        'templateName': 'index',
        'head.title': 'Uptime Monitoring - Made Simple',
        'head.description': 'We offer free, simple uptime monitoring for HTTP/HTTPS sites all kinds. When your site goes down, we\'ll send you a text to let you know',
        'body.class': 'index'
      };
      break;
    case 'account/create':
      templateData = {
        'templateName': 'accountCreate',
        'head.title': 'Create an Account',
        'head.description': 'Signup is easy and only takes a few seconds.',
        'body.class': 'accountCreate'
      };
      break;
    case 'account/edit':
      templateData = {
        'templateName': 'accountEdit',
        'head.title': 'Account Settings',
        'body.class': 'accountEdit'
      };
      break;
    case 'account/deleted':
      templateData = {
        'templateName': 'accountDeleted',
        'head.title': 'Account Deleted',
        'head.description': 'Your account has been deleted.',
        'body.class': 'accountDeleted'
      };
      break;
    case 'session/create':
      templateData = {
        'templateName': 'sessionCreate',
        'head.title': 'Login to your account.',
        'head.description': 'Please enter your phone number and password to access your account.',
        'body.class': 'sessionCreate'
      };
      break;
    case 'session/deleted':
      templateData = {
        'templateName': 'sessionDeleted',
        'head.title': 'Logged Out',
        'head.description': 'You have been logged out of your account.',
        'body.class': 'sessionDeleted'
      };
      break;
    case 'checks/create':
      templateData = {
        'templateName': 'checksCreate',
        'head.title': 'Create a New Check',
        'body.class': 'checksCreate'
      };
      break;
    case 'checks/all':
      templateData = {
        'templateName': 'checksList',
        'head.title': 'Dashboard',
        'body.class': 'checksList'
      };
      break;
    case 'checks/edit':
      templateData = {
        'templateName': 'checksEdit',
        'head.title': 'Check Details',
        'body.class': 'checksEdit'
      };
      break;
    default:
      break;
  }

  let err, resO;
  [err, resO] = await to(getTemplateString(data, templateData));

  callback(resO.resCode, resO.payload, resO.contentType);
};

// Favicon
handlers.favicon = async function (data, callback) {
  if (data.method !== 'get') { callback(405); return; }
  let err;
  [err, data] = await to(helpers.getStaticAssetA('favicon.ico'));
  if (err) { callback(500); return; }
  callback(200, data, 'favicon');
};

// Public assets
handlers.public = async function (data, callback) {

  // Reject any request that isn't a GET
  if (data.method !== 'get') { callback(405); return; }
  // Get the filename being requested
  let trimmedAssetName = data.trimmedPath.replace('public/', '').trim();
  if (trimmedAssetName.length === 0) { callback(404); return; }

  // Read in the asset's data
  let err;
  [err, data] = await to(helpers.getStaticAssetA(trimmedAssetName));
  if (err || !data) { callback(404); return; }

  // Determine the content type (default to plain text)
  let contentType = 'plain';
  if (trimmedAssetName.indexOf('.css') > -1) contentType = 'css';
  else if (trimmedAssetName.indexOf('.png') > -1) contentType = 'png';
  else if (trimmedAssetName.indexOf('.jpg') > -1) contentType = 'jpg';
  else if (trimmedAssetName.indexOf('.ico') > -1) contentType = 'favicon';

  callback(200, data, contentType);
};

/*
 * JSON API Handlers
 *
 */

// Ping
handlers.ping = function (data, callback) {
  callback(200);
};

// Error example (this is why we're wrapping the handler caller in a try catch)
handlers.exampleError = function (data, callback) {
  let err = new Error('This is an example error.');
  throw (err);
};

// Not-Found
handlers.notFound = function (data, callback) {
  callback(404);
};

// requiring sub handlers
handlers._users = require(config.paths._users);
handlers._tokens = require(config.paths._tokens);
handlers._checks = require(config.paths._checks);

// Users async
handlers.usersA = async function (data) {
  let err, res;
  [err, res] = await to(forwardToSubHandler(data, '_users')); return res;
};
// Tokens Async
handlers.tokensA = async function (data) {
  let err, res;
  [err, res] = await to(forwardToSubHandler(data, '_tokens')); return res;
};
// Checks Async
handlers.checksA = async function (data) {
  let err, res;
  [err, res] = await to(forwardToSubHandler(data, '_checks')); return res;
};

// Checks Async
async function forwardToSubHandler (data, subHandler) {
  if (!validate.isCRUDMethod(data.method)) return resO(405);
  let err, res;
  let method = data.method + 'A';
  [err, res] = await to(handlers[subHandler][method](data));
  if (err) return resO(405);
  return resO(res.resCode, res.payload, res.contentType);
}





// Export the handlers
module.exports = handlers;
