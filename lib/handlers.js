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


// let stringData = JSON.stringify(data, null, 2);
// let stringData = JSON.stringify(data, null, 2);
// let stringData = JSON.stringify(data, null, 2);
// let stringData = JSON.stringify(data, null, 2);
// let stringData = JSON.stringify(data, null, 2);

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


// Users
handlers.users = async function (data, callback) {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) === -1) { callback(405); return; }
  let err, res;
  let method = data.method + 'A';
  [err, res] = await to(handlers._users[method](data));
  if (err) { callback(405); return; }
  callback(res.resCode, res.payload, res.contentType);
};


// Tokens
handlers.usersA = async function (data) {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) === -1) return resO(405);
  let err, res;
  let method = data.method + 'A';
  [err, res] = await to(handlers._users[method](data));
  if (err) return resO(405);
  return resO(res.resCode, res.payload, res.contentType);
};

// Container for all the users methods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.postA = async function (data) {
  // Check that all required fields are filled out
  let email = validate.emailAddress(data.payload.login);
  let firstName = validate.firstName(data.payload.firstName);
  let lastName = validate.lastName(data.payload.lastName);
  let phone = validate.phone(data.payload.phone);
  let password = validate.password(data.payload.password);
  let tosAgreement = validate.booleanSimple(data.payload.tosAgreement);

  if (!email || !firstName || !lastName || !phone || !password || !tosAgreement) {
    return resO(400, { 'Error': 'Missing or invalid required fields' });
  }

  let error, rData;
  // Make sure the user does not already exist
  [error, rData] = await to(_data.readA('users', phone), false);
  if (!error) return resO(400, { 'Error': 'A user with that phone number already exists' });

  // Hash the password
  let hashedPassword = helpers.hash(password);
  // Create the user object
  if (!hashedPassword) return resO(500, { 'Error': 'Could not hash the user\'s password.' });

  let userObject = {
    email,
    firstName,
    lastName,
    phone,
    hashedPassword,
    tosAgreement
  };

  // Store the user
  [error] = await to(_data.createA('users', phone, userObject));
  if (error) return resO(500, { 'Error': 'Could not create the new user' });
  return resO(200);
};

// Required data: phone
// Optional data: none
handlers._users.getA = async function (data) {
  // Check that phone number is valid
  let phone = validate.phone(data.queryStringObject.phone);
  if (!phone) return resO(400, { 'Error': 'Missing required field' });
  // Get token from headers
  let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
  let err, tokenIsValid, userData;

  // Verify that the given token is valid for the phone number
  [err, tokenIsValid] = await to(handlers._tokens.verifyTokenA(token, phone));
  if (!tokenIsValid) return resO(403, { "Error": "Missing required token in header, or token is invalid." });

  // Lookup the user
  [err, userData] = await to(_data.readA('users', phone));
  if (err) return resO(404);

  // Remove the hashed password before returning
  delete data.hashedPassword;

  return resO(200, userData);
};

// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
handlers._users.putA = async function (data) {
  // Check for required field
  let phone = validate.phone(data.payload.phone);

  // Check for optional fields
  let firstName = validate.firstName(data.payload.firstName);
  let lastName = validate.lastName(data.payload.lastName);
  let password = validate.password(data.payload.password);

  // Error if phone is invalid
  if (!phone) return resO(400, { 'Error': 'Missing required field.' });

  // Error if nothing is sent to update
  if (!firstName && !lastName && !password) return resO(400, { 'Error': 'Missing fields to update.' });

  // Get token from headers
  let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

  let err, tokenIsValid, userData;
  // Verify that the given token is valid for the phone number
  [err, tokenIsValid] = await to(handlers._tokens.verifyTokenA(token, phone));
  if (err || !tokenIsValid) return resO(403, { "Error": "Missing required token in header, or token is invalid." });

  // Lookup the user
  [err, userData] = await to(_data.readA('users', phone));
  if (err) return resO(400, { 'Error': 'Specified user does not exist.' });
  // Update the fields if necessary
  if (firstName) userData.firstName = firstName;
  if (lastName) userData.lastName = lastName;
  if (password) userData.hashedPassword = helpers.hash(password);

  // Store the new updates
  [err, userData] = await to(_data.updateA('users', phone, userData));
  if (err) return resO(500, { 'Error': 'Could not update the user.' });
  return resO(200);
};

// Required data: phone
// Cleanup old checks associated with the user
handlers._users.deleteA = async function (data) {
  // Check that phone number is valid
  let phone = validate.phone(data.queryStringObject.phone);
  if (!phone) return resO(400, { 'Error': 'Missing required field' });

  // Get token from headers
  let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

  let err, tokenIsValid, userData;
  // Verify that the given token is valid for the phone number
  [err, tokenIsValid] = await to(handlers._tokens.verifyTokenA(token, phone));
  if (err || !tokenIsValid) return resO(403, { "Error": "Missing required token in header, or token is invalid." });

  // Lookup the user
  [err, userData] = await to(_data.readA('users', phone));
  if (err) return resO(400, { 'Error': 'Could not find the specified user.' });

  // Delete the user's data
  [err] = await to(_data.deleteA('users', phone));
  if (err) return resO(500, { 'Error': 'Could not delete the specified user' });

  // Delete each of the checks associated with the user
  let userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
  let checksToDelete = userChecks.length;
  if (checksToDelete === 0) return resO(200);

  let checksDeleted = 0;
  let deletionErrors = false;
  // Loop through the checks
  userChecks.forEach(async (checkId) => {
    // Delete the check
    [err] = await to(_data.delete('checks', checkId));
    if (err) deletionErrors = true;

    checksDeleted++;
    if (checksDeleted === checksToDelete) {
      if (deletionErrors) return resO(500, { 'Error': "Errors encountered while attempting to delete all of the user's checks. All checks may not have been deleted from the system successfully." });
      else return resO(200);
    }
  });
};








// // Tokens
// handlers.tokens = function (data, callback) {
//   let acceptableMethods = ['post', 'get', 'put', 'delete'];
//   if (acceptableMethods.indexOf(data.method) === -1) { callback(405); return; }
//   handlers._tokens[data.method](data, callback);
// };

// Tokens
handlers.tokens = async function (data, callback) {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) === -1) { callback(405); return; }

  let err, res;
  let method = data.method + 'A';
  [err, res] = await to(handlers._tokens[method](data));
  if (err) { callback(405); return; }
  callback(res.resCode, res.payload, res.contentType);
};


// Tokens
handlers.tokensA = async function (data) {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) === -1) return resO(405);
  let err, res;
  let method = data.method + 'A';
  [err, res] = await to(handlers._tokens[method](data));
  if (err) return resO(405);
  return resO(res.resCode, res.payload, res.contentType);
};

// Container for all the tokens methods
handlers._tokens  = require(config.paths._tokens);




// Checks
handlers.checks = function (data, callback) {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the checks methods
handlers._checks = require(config.paths._checks);




// Export the handlers
module.exports = handlers;
