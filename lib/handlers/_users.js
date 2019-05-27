/*
 * Request Handlers - Users
 *
 */

// Dependencies
const _data = require('./../data');
const helpers = require('./../helpers');
const config = require('./../config');
const to = require('./../to.js');
const validate = require('./../validator');
const resO = require(config.paths.gf).resO;
const _tokens = require(config.paths._tokens);

let lib = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
lib.postA = async function (data) {
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
lib.getA = async function (data) {
  // Check that phone number is valid
  let phone = validate.phone(data.queryStringObject.phone);
  if (!phone) return resO(400, { 'Error': 'Missing required field' });
  // Get token from headers
  let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
  let err, tokenIsValid, userData;

  // Verify that the given token is valid for the phone number
  [err, tokenIsValid] = await to(_tokens.verifyTokenA(token, phone));
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
lib.putA = async function (data) {
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
  [err, tokenIsValid] = await to(_tokens.verifyTokenA(token, phone));
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
lib.deleteA = async function (data) {
  // Check that phone number is valid
  let phone = validate.phone(data.queryStringObject.phone);
  if (!phone) return resO(400, { 'Error': 'Missing required field' });

  // Get token from headers
  let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

  let err, tokenIsValid, response;
  // Verify that the given token is valid for the phone number
  [err, tokenIsValid] = await to(_tokens.verifyTokenA(token, phone));
  if (err || !tokenIsValid) return resO(403, { "Error": "Missing required token in header, or token is invalid." });

  [err, response] = await to(deleteFinal(phone));
  return response;
};

// Required data: phone
async function deleteFinal (phone) {
  let err, userData;

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
}

lib.deleteFinal = deleteFinal;


// Export the module
module.exports = lib;