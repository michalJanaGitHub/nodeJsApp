/*
 * Worker-related tasks
 *
 */

// Dependencies
let path = require('path');
let fs = require('fs');
let _data = require('./data');
let https = require('https');
let http = require('http');
let helpers = require('./helpers');
let url = require('url');
let _logs = require('./logs');
let util = require('util');
let debug = util.debuglog('workers');
const config = require('./config');
const to = require(config.paths.to);
const validate = require(config.paths.validator);

// Instantiate the worker module object
let workers = {};

// Lookup all checks, get their data, send to validator
workers.performAllChecks = async function () {
  let err, checks, checkData, checkOutcome, newCheckData, counter = 0;
  console.log('\x1b[33m%s\x1b[0m', 'Starting to perform checks');
  // Get all the checks
  [err, checks] = await to(_data.listA('checks'));

  if (err) { debug('Error: Could not find any checks to process'); return; }
  if (!checks && checks.length === 0) {
    debug('Error: Could not find any checks to process'); return;
  }

  checks.forEach(async function (check) {
    // Read in the check data
    [err, checkData] = await to(_data.readA('checks', check));
    if (err) { debug("Error reading one of the check's data: ", err); return; }

    // validate check data
    checkData = validate.checkDataValidateAll(checkData);
    if (!checkData) { debug('One of the checks is not properly formatted.'); return; }

    // perform check
    [err, checkOutcome] = await to(workers.performCheck(checkData));
    if (err || !checkOutcome) { debug('Error performing check'); return; }

    [err, newCheckData] = await to(workers.processCheckOutcome(checkOutcome));
    if (err || !newCheckData) { debug('Error processing check outcome'); return; }

    if (newCheckData.alertWarranted) {
      [err] = await to(workers.alertUserToStatusChange(newCheckData));
      newCheckData.alertSent = Date.now();
    }
    else debug("Check outcome has not changed, no alert needed");

    [err] = await to(workers.updateCheck(newCheckData));
    if (err) { debug('Error updating check'); return; }    

  });

  setTimeout(() => console.log('\x1b[33m%s\x1b[0m', 'Checks loop finished'), 500);
  
};





// Send check data to a log file
workers.log = function (checkData, checkOutcome, state, alertWarranted, timeOfCheck) {
  // Form the log data
  let logData = {
    'check': checkData,
    'outcome': checkOutcome,
    'state': state,
    'alert': alertWarranted,
    'time': timeOfCheck
  };

  // Convert the data to a string
  let logString = JSON.stringify(logData);

  // Determine the name of the log file
  let logFileName = checkData.id;

  // Append the log string to the file
  _logs.append(logFileName, logString, function (err) {
    if (!err) {
      debug("Logging to file succeeded");
    } else { debug("Logging to file failed"); }
  });

};

// Timer to execute the worker-process once per minute
workers.loop = function () {
  // Execute all the checks immediately
  workers.performAllChecks();
  // Call the loop so the checks will execute later on
  setInterval(function () {
    workers.performAllChecks();
  }, 1000 * 60 * 5); // every 5 minutes
  // Send to console, in yellow
  console.log('\x1b[33m%s\x1b[0m', 'Background workers are running');
};

// Rotate (compress) the log files
workers.rotateLogs = function () {
  // List all the (non compressed) log files
  _logs.list(false, function (err, logs) {
    if (!err && logs && logs.length > 0) {
      logs.forEach(function (logName) {
        // Compress the data to a different file
        let logId = logName.replace('.log', '');
        let newFileId = logId + '-' + Date.now();
        _logs.compress(logId, newFileId, function (err) {
          if (!err) {
            // Truncate the log
            _logs.truncate(logId, function (err) {
              if (!err) {
                debug("Success truncating log file");
              } else {
                debug("Error truncating log file");
              }
            });
          } else {
            debug("Error compressing one of the log files.", err);
          }
        });
      });
    } else {
      debug('Error: Could not find any logs to rotate');
    }
  });
};

// Timer to execute the log-rotation process once per day
workers.startLogRotationLoop = function () {
  setInterval(function () {
    workers.rotateLogs();
  }, 1000 * 60 * 60 * 24);
  console.log('\x1b[33m%s\x1b[0m', 'Log rotation loop started');
};

// Init script
workers.init = function () {

  // start workers that perform checks
  workers.loop();

  // Call the compression loop so checks will execute later on
  if (config.rotateLogs) workers.startLogRotationLoop();

};


// Export the module
module.exports = workers;
