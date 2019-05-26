/*
 * Request Handlers - tokens
 *
 */

// Dependencies
const _data = require('./../data');
const helpers = require('./../helpers');
const config = require('./../config');
const to = require('./../to.js');
const validate = require('./../validator');
const resO = require(config.paths.gf).resO;


let lib = {};


// Tokens - post
// Required data: phone, password
// Optional data: none
lib.postA = async function (data) {
  let phone = validate.phone(data.payload.phone);
  let email = validate.emailAddress(data.payload.email);
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
    'email': email, ///////////////////////////////////////////////////
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
lib.getA = async function (data) {
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
lib.putA = async function (data) {
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


lib.deleteA = async function (data) {
  // Check that id is valid
  let id = validate.token(data.queryStringObject.id);
  if (!id) return resO(400, { 'Error': 'Missing required field' });
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
lib.verifyToken = async function (id, phone, callback) {
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
lib.verifyTokenA = async function (id, phone) {
  let err, tokenData;
  // Lookup the token
  [err, tokenData] = await to(_data.readA('tokens', id));
  if (err) return false;
  // Check that the token is for the given user and has not expired
  if (tokenData.phone !== phone || tokenData.expires < Date.now()) return false;

  return true;
};

// Export the module
module.exports = lib;