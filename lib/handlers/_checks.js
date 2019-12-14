/*
 * Request Handlers - checks
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
const util = require('util');
const url = require('url');
const https = require('https');
const http = require('http');

let lib = {};

// Checks - post (create)
// Required data: protocol,url,method,successCodes,timeoutSeconds
// Optional data: none
lib.postA = async function (data) {
  // Validate inputs
  let protocol = validate.checksProtocol(data.payload.protocol);
  let url = validate.checksUrl(data.payload.url);
  let method = validate.CRUDMethod(data.payload.method);
  let successCodes = validate.checksSuccessCodes(data.payload.successCodes);
  let timeoutSeconds = validate.checksTimeoutSeconds(data.payload.timeoutSeconds);

  if (!protocol || !url || !method || !successCodes || !timeoutSeconds)
    return resO(400, { 'Error': 'Missing required inputs, or inputs are invalid' });

  // Get token from headers
  let tokenId = validate.stringSimple(data.headers.token);
  let err, userData, res;

  // Lookup the user email by reading the token
  [err, userData] = await to(_tokens.getUserDataFromToken(tokenId));
  if (err || !userData) return resO(403);

  let userChecks = validate.arrayNonEmpty(userData.checks);
  if (!userChecks) userChecks = [];
  // Verify that user has less than the number of max-checks per user
  if (userChecks.length >= config.maxChecks) return resO(400, { 'Error': 'The user already has the maximum number of checks (' + config.maxChecks + ').' });
  // Create random id for check`
  let checkId = helpers.createRandomString(20);

  // Create check object including email
  let checkObject = {
    'id': checkId,
    'email': userData.email,
    'protocol': protocol,
    'url': url,
    'method': method,
    'successCodes': successCodes,
    'timeoutSeconds': timeoutSeconds
  };

  // Save the object
  [err] = await to(_data.createA('checks', checkId, checkObject));
  if (err) return resO(500, { 'Error': 'Could not create the new check' });

  // Add check id to the user's object
  userData.checks = userChecks;
  userData.checks.push(checkId);

  // Save the new user data
  [err] = await to(_data.updateA('users', userData.email, userData));
  // Return the data about the new check
  if (err) return resO(500, { 'Error': 'Could not update the user with the new check.' });
  return resO(200, checkObject);
};


// Checks - get (read)
// Required data: id
// Optional data: none

lib.getA = async function (data) {
  let err, checkData, token, tokenIsValid, id;

  // Check that id and token are valid
  id = validate.checkId(data.queryStringObject.id);
  token = validate.stringSimple(data.headers.token);
  if (!id || !token) return resO(400, { 'Error': 'Missing/invalid token/checkId' });

  // Lookup the check
  [err, checkData] = await to(_data.readA('checks', id));
  if (err || !checkData) return resO(404, { 'Error': 'Could not find/read the check' });

  // Verify that the given token is valid and belongs to the user who created the check
  [err, tokenIsValid] = await to(_tokens.verifyTokenA(token, checkData.email));
  // Return check data
  if (err || !tokenIsValid) return resO(403, { 'Error': 'Could not read/verify token' });

  return resO(200, checkData);
};


// Checks - put (update)
// Required data: id
// Optional data: protocol,url,method,successCodes,timeoutSeconds (one must be sent)
lib.putA = async function (data) {
  let err, checkData, tokenIsValid;

  // Check for required field
  let id = validate.checkId(data.payload.id);
  let token = validate.stringSimple(data.headers.token);
  if (!id || !token) return resO(400, { 'Error': 'Missing/invalid token or checkId.' });

  // Check for optional fields
  let protocol = validate.checksProtocol(data.payload.protocol);
  let url = validate.checksUrl(data.payload.url);
  let method = validate.CRUDMethod(data.payload.method);
  let successCodes = validate.checksSuccessCodes(data.payload.successCodes);
  let timeoutSeconds = validate.checksTimeoutSeconds(data.payload.timeoutSeconds);

  if (!protocol && !url && !method && !successCodes && !timeoutSeconds)
    return resO(400, { 'Error': 'Missing fields to update.' });

  // Lookup the check
  [err, checkData] = await to(_data.readA('checks', id));
  if (err || !checkData) return resO(400, { 'Error': 'Could not read/find checkId' });

  // Verify that the given token is valid and belongs to the user who created the check
  [err, tokenIsValid] = await to(_tokens.verifyTokenA(token, checkData.email));
  if (err || !tokenIsValid)
    return resO(403, { 'Error': 'Could not read/verify token' });

  // Update check data where necessary
  if (protocol) checkData.protocol = protocol;
  if (url) checkData.url = url;
  if (method) checkData.method = method;
  if (successCodes) checkData.successCodes = successCodes;
  if (timeoutSeconds) checkData.timeoutSeconds = timeoutSeconds;

  // Store the new updates
  [err] = await to(_data.updateA('checks', id, checkData));
  if (err) return resO(500, { 'Error': 'Could not update the check.' });

  return resO(200);
};


// Checks - delete
// Required data: id
// Optional data: none
// Checks - delete async
lib.deleteA = async function (data) {
  let err, tokenIsValid, checkData, userData;
  // Check that id is valid
  let id = validate.checkId(data.queryStringObject.id);
  if (!id) return resO(400, { "Error": "Missing valid CheckId" });
  // Get the token that sent the request
  let token = validate.stringSimple(data.headers.token);
  if (!token) return resO(400, { "Error": "Missing token" });

  // Lookup the check
  [err, checkData] = await to(_data.readA('checks', id));
  if (err) return resO(400, { "Error": "The check ID specified could not be found" });

  // Verify that the given token is valid and belongs to the user who created the check
  [err, tokenIsValid] = await to(_tokens.verifyTokenA(token, checkData.email));
  if (err || !tokenIsValid) return resO(403);

  // Delete the check data
  [err] = await to(_data.deleteA('checks', id));
  if (err) return resO(500, { "Error": "Could not delete the check data." });

  // Lookup the user's object to get all their checks
  [err, userData] = await to(_data.readA('users', checkData.email));
  if (err || !userData) return resO(500, { "Error": "Could not find the user who created the check, so could not remove the check from the list of checks on their user object." });

  let userChecks = validate.arrayNonEmpty(userData.checks);

  // Remove the deleted check from their list of checks
  let checkPosition = userChecks.indexOf(id);
  if (checkPosition === -1)
    return resO(500, { "Error": "Could not find the check on the user's object, so could not remove it." });

  userChecks.splice(checkPosition, 1);
  // Re-save the user's data
  userData.checks = userChecks;
  [err] = await to(_data.updateA('users', checkData.email, userData));
  if (err) return resO(500, { 'Error': 'Could not update the user.' });

  return resO(200);
};


// Perform the check, send the originalCheck data and the outcome of the check process to the next step in the process
lib.performCheck = async function (checkData) {

  // Prepare the initial check outcome
  let checkOutcome = {
    'error': false,
    'responseCode': false
  };

  // Mark that the outcome has not been sent yet
  let outcomeSent = false;

  // Parse the hostname and path out of the original CheckData
  let parsedUrl = url.parse(checkData.protocol + '://' + checkData.url, true);
  let hostName = parsedUrl.hostname;
  let path = parsedUrl.path; // Using path not pathname because we want the query string

  // Construct the request
  let requestDetails = {
    'protocol': checkData.protocol + ':',
    'hostname': hostName,
    'method': checkData.method.toUpperCase(),
    'path': path,
    'timeout': checkData.timeoutSeconds * 1000
  };

  // Instantiate the request object (using either the http or https module)
  let _moduleToUse = checkData.protocol === 'http' ? http : https;
  let req = _moduleToUse.request(requestDetails, function (res) {

    res.on('data', (d) => {
      process.stdout.write(d);
    });

    // Grab the status of the sent request
    let status = res.statusCode;

    // Update the checkOutcome and pass the data along
    checkOutcome.responseCode = status;
    if (!outcomeSent) {
      outcomeSent = true;
      return (checkOutcome);
    }
  });

  // Bind to the error event so it doesn't get thrown
  req.on('error', function (e) {
    // Update the checkOutcome and pass the data along
    checkOutcome.error = { 'error': true, 'value': e };
    if (!outcomeSent) {
      outcomeSent = true;
      return (checkOutcome);
    }
  });

  // Bind to the timeout event
  req.on('timeout', function () {
    // Update the checkOutcome and pass the data along
    checkOutcome.error = { 'error': true, 'value': 'timeout' };
    if (!outcomeSent) {
      outcomeSent = true;
      return (checkOutcome);
    }
  });

  // End the request
  req.end();
};

// Process the check outcome, update the check data as needed, trigger an alert if needed
// Special logic for accommodating a check that has never been tested before (don't alert on that one)
lib.processCheckOutcome = async function (checkData, checkOutcome) {
  let newCheckData = checkData;

  // Decide if the check is considered up or down
  let state =
    !checkOutcome.error &&
      checkOutcome.responseCode &&
      checkData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

  // Decide if an alert is warranted
  let alertWarranted = checkData.lastChecked && checkData.state !== state ? true : false;
  if (alertWarranted) newCheckData.alertWarranted = true;
  // Log the outcome
  let timeOfCheck = Date.now();
  workers.log(checkData, checkOutcome, state, alertWarranted, timeOfCheck);

  // Update the check data
  newCheckData.state = state;
  newCheckData.lastChecked = timeOfCheck;
  return newCheckData;
};

lib.updateCheck = async function (newCheckData) {
  let err;
  // Save the updates
  [err] = await to(_data.update('checks', newCheckData.id, newCheckData));
  if (err) { debug("Error trying to save updates to one of the checks"); return; }
  return;
};

// Alert the user as to a change in their check status
lib.alertUserToStatusChange = async function (newCheckData) {
  // let msg = 'Alert: Your check for '+newCheckData.method.toUpperCase()+' '+newCheckData.protocol+'://'+newCheckData.url+' is currently '+newCheckData.state;
  // helpers.sendTwilioSms(newCheckData.userEmail,msg,function(err){
  //   if(!err){
  //     debug("Success: User was alerted to a status change in their check, via sms: ",msg);
  //   } else {
  //     debug("Error: Could not send sms alert to user who had a state change in their check",err);
  //   }
  // });
  return;
};




// Export the module
module.exports = lib;