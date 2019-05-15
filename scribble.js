/*
$env:NODE_ENV="staging"; $env:NODE_DEBUG="workers"; node scribble.js
$env:NODE_ENV="staging"; $env:NODE_DEBUG="workers"; nodemon scribble.js
$env:NODE_ENV="production"; $env:NODE_DEBUG="workers"; node scribble.js
$env:NODE_ENV="production"; $env:NODE_DEBUG="workers"; nodemon scribble.js
*/

// Dependencies
const _data = require('./lib/data');
const fs = require('fs');
const config = require('./lib/config');
const zlib = require('zlib');
const util = require('util');
const debug = util.debuglog('workers');
const to = require('./lib/to.js');
const http = require('http');

// Application logic for the test runner
_app = {};

// Holder of all tests
_app.tests = {};

// Dependencies
_app.tests.unit = require('./test/unit');
_app.tests.api = require('./test/api');

console.log('\x1b[33m%s\x1b[0m', 'start scribble');
// console.log('env: ', process.env.NODE_ENV);
// console.log('debug: ', process.env.NODE_DEBUG);

// Count all the tests
_app.countTests = function () {
  let noOfTestsRun = 0;
  Object.keys(_app.tests).map(subTest => {
    Object.keys(_app.tests[subTest]).map(test => {
      noOfTestsRun++;
    }); 
  });
  return noOfTestsRun;
};


console.log(_app.countTests());


// let helpers = {};
// helpers.makeGetRequest = function (path, method, callback, payload = '{}') {
//   method = method.toUpperCase();
//   // Configure the request details
//   let requestDetails = {
//     'protocol' : 'http:',
//     'hostname' : 'localhost',
//     'port' : config.httpPort,
//     'method' : method,
//     'path': path,
//     'body': {body:JSON.stringify(payload)},
//     'headers' : {
//       'Content-Type' : 'application/json'
//     }
//   };

//   // Send the request
//   let req = http.request(requestDetails, function(res){
//       callback(res);
//   });
//   req.end();
// };

// // Make a request to /ping
// function getToken () {
//   let payload = {
//     phone: 1234567890,
//     password: "password"
//   };
//   helpers.makeGetRequest('api/tokens', 'post', callback, payload)
  
//   function callback (resCode, tokenObject){
//     console.log(resCode);
//     console.log(tokenObject);
//   }
// }

// getToken();











// let now = new Date();
// console.log(now.toJSON());

// (async () => {
//   let err, data;

//   [err] = await to (_data.createA('test', 'test0005', { "test": "test" }));
//   if (err) console.log(err);
//   else console.log('ok create');

//   if (!err) {
//     [err, data] = await to (_data.readA('test', 'test0005'));
//     if (err) console.log(err);
//     else console.log('ok read', data);
//   }

//   if (!err) {
//     [err, data] = await to (_data.updateA('test', 'test0005'), { "update": "update" });
//     if (err) console.log(err);
//     else console.log('ok update');
//   }

//   if (!err) {
//     [err] = await to (_data.deleteA('test', 'test0005'));
//     if (err) console.log(err);
//     else console.log('ok delete');
//   }
  
// })();


// (async () => {
//   let err, data;

//   if (!err) [err]       = await to(_data.createA('test', 'testAsyncCRUD', { "test": "test" }));
//   if (!err) [err] =       await to(_data.updateA('test', 'testAsyncCRUD', { "update": "update" }));
//   if (!err) [err, data] = await to(_data.readA('test', 'testAsyncCRUD'));
//   if (!err) [err]       = await to(_data.deleteA('test', 'testAsyncCRUD'));

//   console.log(data);
  
// })();


  // data.createA('test', 'test0006', { "test": "test" })
  // .then(() => {
  //   console.log('ok create');
  //   return data.deleteA('test', 'test0006');    
  // })
  // .then(() => console.log('ok delete'))
  // .catch(err => console.log(err));




// console.log('\x1b[33m%s\x1b[0m','end scribble');