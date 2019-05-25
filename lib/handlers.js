/*
 * Request Handlers
 *
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');
const assert = require('assert');
const to = require('./to.js');
const validate = require('./validator');


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

function resO(resCode, payload, contentType) {
  let resO = {};
  if (resCode) resO.resCode = resCode;
  if (payload) resO.payload = payload;
  if (contentType) resO.contentType = contentType;
  return resO;
}

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
  let phone = validate.phone(data.queryStringObject.phone);

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
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.postA = async function (data) {
  let phone = validate.phone(data.payload.phone);
  let password = validate.password(data.payload.password);
  if (!phone || !password) return (resO(400, { 'Error': 'Missing required field(s).' }));
  // Lookup the user who matches that phone number

  let error, userData;
  [error, userData] = await to(_data.readA('users', phone));
  if (error) return (resO(400, { 'Error': 'Could not find the specified user.' }));

  // Hash the sent password, and compare it to the password stored in the user object
  let hashedPassword = helpers.hash(password);
  if (hashedPassword !== userData.hashedPassword) {
    return (resO(400, { 'Error': 'Password did not match the specified user\'s stored password' }));
  }

  // If valid, create a new token with a random name. Set an expiration date 1 hour in the future.
  let tokenId = helpers.createRandomString(20);
  let expires = Date.now() + 1000 * 60 * 60;
  let tokenObject = {
    'phone': phone,
    'id': tokenId,
    'expires': expires
  };

  // Store the token
  [error] = await to(_data.createA('tokens', tokenId, tokenObject));
  if (error) return (resO(500, { 'Error': 'Could not create the new token' }));

  return (resO(200, tokenObject));
};


// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.getA = async function (data) {
  // Check that id is valid
  let id = validate.token(data.queryStringObject.id);
  if (!id) throw new Error('Missing required field, or field invalid');

  // Lookup the token
  let error, tokenData;
  [error, tokenData] = await to(_data.readA('tokens', id));
  if (error) return resO(400);
  else return resO(200, tokenData);
};

// Tokens - put - updates the existing token
// Required data: id, extend
// Optional data: none
handlers._tokens.putA = async function (data) {
  let id = validate.token(data.payload.id);
  let extend = validate.booleanSimple(data.payload.extend);
  if (!id || !extend) return resO(400, { "Error": "Missing required field(s) or field(s) are invalid." });


  // Lookup the token
  let err, tokenData;
  [err, tokenData] = await to(_data.readA('tokens', id));
  if (err) return resO(400, { 'Error': 'Specified user does not exist.' });
  // Check to make sure the token isn't already expired
  if (tokenData.expires <   Date.now())
    return resO(400, { "Error": "The token has already expired, and cannot be extended." });

  // Set the expiration an hour from now
  tokenData.expires = Date.now() + 1000 * 60 * 60;
  // Store the new updates
  [err] = await to(_data.updateA('tokens', id, tokenData));
  if (err)
    return resO(500, { 'Error': 'Could not update the token\'s expiration.' });
  return resO(200);
};


handlers._tokens.deleteA = async function (data) {
  // Check that id is valid
  let id = validate.token(data.queryStringObject.id);
  if (!id) { callback(400, { 'Error': 'Missing required field' }); return; }
  // Lookup the token
  let err, tokenData;

  [err, tokenData] = await to(_data.readA('tokens', id));
  if (err) return (resO(400, { 'Error': 'Could not find the specified token.' }));

  // Delete the token
  [err] = await to(_data.deleteA('tokens', id));
  if (err) return (resO(500, { 'Error': 'Could not delete the specified token' }));

  return resO(200);
};


// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = async function (id, phone, callback) {
  let err, tokenData;
  // Lookup the token
  [err, tokenData] = await to(_data.readA('tokens', id));
  if (err) { callback(false); return; }
  // Check that the token is for the given user and has not expired
  if (tokenData.phone == phone && tokenData.expires > Date.now()) {
    callback(true);
  } else callback(false);
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyTokenA = async function (id, phone) {
  let err, tokenData;
  // Lookup the token
  [err, tokenData] = await to(_data.readA('tokens', id));
  if (err) return false;
  // Check that the token is for the given user and has not expired
  if (tokenData.phone !== phone || tokenData.expires < Date.now()) return false;

  return true;
};






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
handlers._checks = {};


// Checks - post
// Required data: protocol,url,method,successCodes,timeoutSeconds
// Optional data: none
handlers._checks.post = function (data, callback) {
  // Validate inputs
  let protocol = typeof (data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  let url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  let method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  let successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  let timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
  if (protocol && url && method && successCodes && timeoutSeconds) {

    // Get token from headers
    let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

    // Lookup the user phone by reading the token
    _data.read('tokens', token, function (err, tokenData) {
      if (!err && tokenData) {
        let userPhone = tokenData.phone;

        // Lookup the user data
        _data.read('users', userPhone, function (err, userData) {
          if (!err && userData) {
            let userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
            // Verify that user has less than the number of max-checks per user
            if (userChecks.length < config.maxChecks) {
              // Create random id for check
              let checkId = helpers.createRandomString(20);

              // Create check object including userPhone
              let checkObject = {
                'id': checkId,
                'userPhone': userPhone,
                'protocol': protocol,
                'url': url,
                'method': method,
                'successCodes': successCodes,
                'timeoutSeconds': timeoutSeconds
              };

              // Save the object
              _data.create('checks', checkId, checkObject, function (err) {
                if (!err) {
                  // Add check id to the user's object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // Save the new user data
                  _data.update('users', userPhone, userData, function (err) {
                    // Return the data about the new check
                    if (!err) callback(200, checkObject);
                    else callback(500, { 'Error': 'Could not update the user with the new check.' });
                  });
                } else callback(500, { 'Error': 'Could not create the new check' });
              });
            } else callback(400, { 'Error': 'The user already has the maximum number of checks (' + config.maxChecks + ').' });
          } else callback(403);
        });
      } else callback(403);
    });
  } else callback(400, { 'Error': 'Missing required inputs, or inputs are invalid' });
};

// Checks - get
// Required data: id
// Optional data: none
handlers._checks.get = function (data, callback) {
  // Check that id is valid
  let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    // Lookup the check
    _data.read('checks', id, function (err, checkData) {
      if (!err && checkData) {
        // Get the token that sent the request
        let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        // Verify that the given token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(token, checkData.userPhone, function (tokenIsValid) {
          // Return check data
          if (tokenIsValid) callback(200, checkData);
          else callback(403);
        });
      } else callback(404);
    });
  } else {
    callback(400, { 'Error': 'Missing required field, or field invalid' });
  }
};

// Checks - put
// Required data: id
// Optional data: protocol,url,method,successCodes,timeoutSeconds (one must be sent)
handlers._checks.put = function (data, callback) {
  // Check for required field
  let id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

  // Check for optional fields
  let protocol = typeof (data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  let url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  let method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  let successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  let timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

  // Error if id is invalid
  if (id) {
    // Error if nothing is sent to update
    if (protocol || url || method || successCodes || timeoutSeconds) {
      // Lookup the check
      _data.read('checks', id, function (err, checkData) {
        if (!err && checkData) {
          // Get the token that sent the request
          let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
          // Verify that the given token is valid and belongs to the user who created the check
          handlers._tokens.verifyToken(token, checkData.userPhone, function (tokenIsValid) {
            if (tokenIsValid) {
              // Update check data where necessary
              if (protocol) checkData.protocol = protocol;
              if (url) checkData.url = url;
              if (method) checkData.method = method;
              if (successCodes) checkData.successCodes = successCodes;
              if (timeoutSeconds) checkData.timeoutSeconds = timeoutSeconds;

              // Store the new updates
              _data.update('checks', id, checkData, function (err) {
                if (!err) callback(200);
                else callback(500, { 'Error': 'Could not update the check.' });
              });
            } else callback(403);
          });
        } else callback(400, { 'Error': 'Check ID did not exist.' });
      });
    } else callback(400, { 'Error': 'Missing fields to update.' });
  } else callback(400, { 'Error': 'Missing required field.' });
};


// Checks - delete
// Required data: id
// Optional data: none
handlers._checks.delete = function (data, callback) {
  // Check that id is valid
  let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    // Lookup the check
    _data.read('checks', id, function (err, checkData) {
      if (!err && checkData) {
        // Get the token that sent the request
        let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        // Verify that the given token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(token, checkData.userPhone, function (tokenIsValid) {
          if (tokenIsValid) {

            // Delete the check data
            _data.delete('checks', id, function (err) {
              if (!err) {
                // Lookup the user's object to get all their checks
                _data.read('users', checkData.userPhone, function (err, userData) {
                  if (!err) {
                    let userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                    // Remove the deleted check from their list of checks
                    let checkPosition = userChecks.indexOf(id);
                    if (checkPosition > -1) {
                      userChecks.splice(checkPosition, 1);
                      // Re-save the user's data
                      userData.checks = userChecks;
                      _data.update('users', checkData.userPhone, userData, function (err) {
                        if (!err) callback(200);
                        else callback(500, { 'Error': 'Could not update the user.' });
                      });
                    } else callback(500, { "Error": "Could not find the check on the user's object, so could not remove it." });
                  } else callback(500, { "Error": "Could not find the user who created the check, so could not remove the check from the list of checks on their user object." });
                });
              } else callback(500, { "Error": "Could not delete the check data." });
            });
          } else callback(403);
        });
      } else callback(400, { "Error": "The check ID specified could not be found" });
    });
  } else callback(400, { "Error": "Missing valid id" });
};

// Export the handlers
module.exports = handlers;
