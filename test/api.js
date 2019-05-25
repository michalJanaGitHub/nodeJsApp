/*
 * API Tests
 *
 */

// Dependencies
const app = require('./../index');
const assert = require('assert');
const http = require('http');
const config = require('./../lib/config');

// Holder for Tests
let api = {};

// Helpers
let helpers = {};
helpers.makeGetRequest = function (path, method, callback, payload = '{}') {
  method = method.toUpperCase();
  // Configure the request details
  let requestDetails = {
    'protocol' : 'http:',
    'hostname' : 'localhost',
    'port' : config.httpPort,
    'method' : method,
    'path': path,
    'body': {body:JSON.stringify(payload)},
    'headers' : {
      'Content-Type' : 'application/json'
    }
  };

  // Send the request
  let req = http.request(requestDetails, function(res){
      callback(res);
  });
  req.end();
};

// // Make a request to /ping
// api['api/tokens return a token'] = function (done) {
//   let payload = {
//     phone: 1234567890,
//     password: "password"
//   };
//   helpers.makeGetRequest('api/tokens', 'post', callback, payload) 
  
//   function callback (resCode, tokenObject){

//   }
// };









// The main init() function should be able to run without throwing.
api['app.init should start without throwing'] = function (done) {
  try {
  assert.doesNotThrow(function () {
    app.init(function(err){
      done(false);
    });
  }, TypeError);
  } catch (e) { done(e); }  
};

// Make a request to /ping
api['/ping should respond to GET with 200'] = function(done){
  helpers.makeGetRequest('/ping', 'get', function (res) {
    try {
      assert.equal(res.statusCode,200);
      done(false);
    } catch (e) { done(e); }
  });
};

// Make a request to /api/users
api['/api/users should respond to GET with 400'] = function(done){
  helpers.makeGetRequest('/api/users', 'get', function (res) {
    try {    
      assert.equal(res.statusCode,400);
      done(false);
    } catch (e) { done(e); }
    
  });
};

// Make a request to a random path
api['A random path should respond to GET with 404'] = function(done){
  helpers.makeGetRequest('/this/path/shouldnt/exist', 'get', function (res) {
    try {    
      assert.equal(res.statusCode,404);
      done(false);
    } catch (e) { done(e); }
      
  });
};

// Export the tests to the runner
module.exports = api;
