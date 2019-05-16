/*
 * Helpers for various tasks
 *
 */

// Dependencies
const config = require('./config');
const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');
const path = require('path');
const util = require('util');
const fs = require('fs');
const fsp = require('./fsP');
const to = require('./to.js');

// Container for all the helpers
var helpers = {};

// Sample for testing that simply returns a number
helpers.getANumber = () => { return 1; };

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function (str) {
  try {
    let obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
};

// Create a SHA256 hash
helpers.hash = function (str) {
  if (typeof (str) == 'string' && str.length > 0) {
    let hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else return false;
};

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function (l) {
  l = typeof (l) == 'number' && l > 0 ? l : false;
  if (!l) return false;
  // Define all the possible characters that could go into a string
  let possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  // Start the final string
  let str = '';
  for (i = 1; i <= l; i++) {
    str += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
  }
  // Return the final string
  return str;
};

helpers.sendTwilioSms = function (phone, msg, callback) {
  // Validate parameters
  phone = typeof (phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
  msg = typeof (msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
  if (phone && msg) {

    // Configure the request payload
    var payload = {
      'From': config.twilio.fromPhone,
      'To': '+1' + phone,
      'Body': msg
    };
    var stringPayload = querystring.stringify(payload);


    // Configure the request details
    var requestDetails = {
      'protocol': 'https:',
      'hostname': 'api.twilio.com',
      'method': 'POST',
      'path': '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
      'auth': config.twilio.accountSid + ':' + config.twilio.authToken,
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    };

    // Instantiate the request object
    var req = https.request(requestDetails, function (res) {
      // Grab the status of the sent request
      var status = res.statusCode;
      // Callback successfully if the request went through
      if (status == 200 || status == 201) {
        callback(false);
      } else callback('Status code returned was ' + status);
    });

    // Bind to the error event so it doesn't get thrown
    req.on('error', e => callback(e));
    req.write(stringPayload); // Add the payload
    req.end();  // End the request

  } else callback('Given parameters were missing or invalid');
};

// Get the string content of a template, and use provided data for string interpolation
helpers.getTemplateA = async function (templateName, data) {
  let err, str;
  templateName = typeof (templateName) == 'string' && templateName.length > 0 ? templateName : false;
  data = typeof (data) == 'object' && data !== null ? data : {};
  if (!templateName)
    throw new Error('A valid template name was not specified');

  let templatesPath = path.join(__dirname, '/../templates/');
  templatesPath = templatesPath + templateName + '.html';

  [err, str] = await to(fsp.readFile(templatesPath, 'utf8'));
  if (err)
    throw new Error('A valid template name was not specified');
  if (str.length === 0)
    throw new Error('No template could be found');
  let finalString = helpers.interpolate(str, data);
  return finalString;
};

// Add the universal header and footer to a string, and pass provided data object to header and footer for interpolation
helpers.addUniversalTemplatesA = async function (str, data) {
  str = typeof (str) == 'string' && str.length > 0 ? str : '';
  data = typeof (data) == 'object' && data !== null ? data : {};

  let err, headerString, footerString;
  // Get the header
  [err, headerString] = await to (helpers.getTemplateA('_header', data));
  if (err) throw new Error('Could not find the header template');
  // Get the footer
  [err, footerString] = await to (helpers.getTemplateA('_footer', data));
  if (err) throw new Error('Could not find the footer template');
  // Add them all together
  let fullString = headerString + str + footerString;
  return fullString;
};

// Take a given string and data object, and find/replace all the keys within it
helpers.interpolate = function (str, data) {
  str = typeof (str) == 'string' && str.length > 0 ? str : '';
  data = typeof (data) == 'object' && data !== null ? data : {};

  // Add the templateGlobals to the data object, pre-pending their key name with "global."
  Object.keys(config.templateGlobals).map((keyName) => {
    data['global.' + keyName] = config.templateGlobals[keyName];
  });

  Object.keys(data).map((keyName) => {
    if (typeof (data[keyName]) !== 'string') return;
    var replace = data[keyName];
    var find = '{' + keyName + '}';
    str = str.replace(find, replace);
  });

  return str;
};

// Get the contents of a static (public) asset
helpers.getStaticAssetA = async function (fileName) {
  let err, data;
  fileName = typeof (fileName) == 'string' && fileName.length > 0 ? fileName : false;
  if (!fileName) throw new error('A valid file name was not specified');
  let publicDir = path.join(__dirname, '/../public/');
  
  [err, data] = await to(fsp.readFile(publicDir + fileName));
  if (err) throw new Error('No file could be found');

  return data;
};


// Export the module
module.exports = helpers;
