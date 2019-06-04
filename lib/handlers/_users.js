/*
 * Request Handlers - Users
 *
 */

// Dependencies
const _data = require('./../data');
const helpers = require('./../helpers');
const config = require('./../config');
const to = require('./../to.js');
const validate = require(config.paths.validator);
const resO = require(config.paths.gf).resO;
const _tokens = require(config.paths._tokens);

let lib = {};

// Users - post
// Required data: firstName, lastName, email, password, tosAgreement
// Optional data: none
lib.postA = async function (data) {
  // Check that all required fields are filled out
  let email = validate.emailAddress(data.payload.email);
  let firstName = validate.firstName(data.payload.firstName);
  let lastName = validate.lastName(data.payload.lastName);
  let password = validate.password(data.payload.password);
  let tosAgreement = validate.booleanSimple(data.payload.tosAgreement);

  if (!email || !firstName || !lastName || !password || !tosAgreement) {
    return resO(400, { 'Error': 'Missing or invalid required fields' });
  }

  let error, rData;
  // Make sure the user does not already exist
  [error, rData] = await to(_data.readA('users', email), false);
  if (!error) return resO(400, { 'Error': 'A user with that email already exists' });

  // Hash the password
  let hashedPassword = helpers.hash(password);
  // Create the user object
  if (!hashedPassword) return resO(500, { 'Error': 'Could not hash the user\'s password.' });

  let userObject = {
    email,
    firstName,
    lastName,
    hashedPassword,
    tosAgreement
  };

  // Store the user
  [error] = await to(_data.createA('users', email, userObject));
  if (error) return resO(500, { 'Error': 'Could not create the new user' });
  return resO(200);
};

// Required data: email
// Optional data: none
lib.getA = async function (data) {
  // Check that email is valid
  let email = validate.emailAddress(data.queryStringObject.email);
  if (!email) return resO(400, { 'Error': 'Missing required field' });
  // Get token from headers
  let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
  let err, tokenIsValid, userData;

  // Verify that the given token is valid for the email number
  [err, tokenIsValid] = await to(_tokens.verifyTokenA(token, email));
  if (!tokenIsValid) return resO(403, { "Error": "Missing required token in header, or token is invalid." });

  // Lookup the user
  [err, userData] = await to(_data.readA('users', email));
  if (err) return resO(404);

  // Remove the hashed password before returning
  delete data.hashedPassword;

  return resO(200, userData);
};

// Required data: email
// Optional data: firstName, lastName, password (at least one must be specified)
lib.putA = async function (data) {
  // Check for required field
  let email = validate.emailAddress(data.payload.email);

  // Check for optional fields
  let firstName = validate.firstName(data.payload.firstName);
  let lastName = validate.lastName(data.payload.lastName);
  let password = validate.password(data.payload.password);

  // Error if email is invalid
  if (!email) return resO(400, { 'Error': 'Missing required field.' });

  // Error if nothing is sent to update
  if (!firstName && !lastName && !password) return resO(400, { 'Error': 'Missing fields to update.' });

  // Get token from headers
  let token = validate.stringSimple(data.headers.token);

  let err, tokenIsValid, userData;
  // Verify that the given token is valid for the email
  [err, tokenIsValid] = await to(_tokens.verifyTokenA(token, email));
  if (err || !tokenIsValid) return resO(403, { "Error": "Missing required token in header, or token is invalid." });

  // Lookup the user
  [err, userData] = await to(_data.readA('users', email));
  if (err) return resO(400, { 'Error': 'Specified user does not exist.' });
  // Update the fields if necessary
  if (firstName) userData.firstName = firstName;
  if (lastName) userData.lastName = lastName;
  if (password) userData.hashedPassword = helpers.hash(password);

  // Store the new updates
  [err, userData] = await to(_data.updateA('users', email, userData));
  if (err) return resO(500, { 'Error': 'Could not update the user.' });
  return resO(200);
};

// Required data: email
// Cleanup old checks associated with the user
lib.deleteA = async function (data) {
  // Check that email is valid
  let email = validate.emailAddress(data.queryStringObject.email);
  if (!email) return resO(400, { 'Error': 'Missing required field' });

  // Get token from headers
  let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

  let err, tokenIsValid, response;
  // Verify that the given token is valid for the email
  [err, tokenIsValid] = await to(_tokens.verifyTokenA(token, email));
  if (err || !tokenIsValid) return resO(403, { "Error": "Missing required token in header, or token is invalid." });

  [err, response] = await to(deleteFinal(email));
  return response;
};

// Required data: email
async function deleteFinal (email) {
  let err, userData;

  // Lookup the user
  [err, userData] = await to(_data.readA('users', email));
  if (err) return resO(400, { 'Error': 'Could not find the specified user.' });

  // Delete the user's data
  [err] = await to(_data.deleteA('users', email));
  if (err) return resO(500, { 'Error': 'Could not delete the specified user' });

  // Delete each of the checks associated with the user
  let userChecks = typeof (userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
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
}

lib.deleteFinal = deleteFinal;


// Export the module
module.exports = lib;