/*
 * Unit Tests
 *
 */

// Dependencies
const config = require('./../lib/config');
const helpers = require('./../lib/helpers.js');
const logs = require('./../lib/logs.js');
const exampleDebuggingProblem = require('./../lib/exampleDebuggingProblem.js');
const assert = require('assert');
const _data = require('./../lib/data.js');
const _tokens = require('./../lib/data.js');
const to = require('./../lib/to');
const handlers = require('./../lib/handlers');
const _checks = require(config.paths._checks);

// Holder for Tests
let unit = {};

unit['data.Async CRUD'] = async function (done) {
  let err, data;

  if (!err) [err] = await to(_data.createA('test', 'uniAsyncCRUD', { "test": "test" }));
  if (!err) [err] = await to(_data.updateA('test', 'uniAsyncCRUD', { "update": "update" }));
  if (!err) [err, data] = await to(_data.readA('test', 'uniAsyncCRUD'));
  if (!err) [err] = await to(_data.deleteA('test', 'uniAsyncCRUD'));

  try {
    assert.equal(err, null);
    assert.equal(JSON.stringify(data), JSON.stringify({ "update": "update" }));
    done(false);
  } catch (e) { done(e); }
};

unit['data.create basic'] = async function (done) {
  _data.create('test', 'unitDataCRUD', { 'test': 'test' }, function (err) {
    try {
      assert.equal(err, false);
      done(false);
    } catch (e) { done(e); }
  });
};

unit['data.update basic'] = function (done) {
  _data.update('test', 'unitDataCRUD', { update: 'update' }, function (err) {
    try {
      assert.equal(err, false);
      done(false);
    } catch (e) { done(e); }
  });
};

unit['data.read basic'] = function (done) {
  _data.create('test', 'unitDataREAD', { 'test': 'test' }, function (err) {
    _data.read('test', 'unitDataREAD', function (err, jsonData) {
      try {
        assert.equal(err, false);
        assert.equal(JSON.stringify(jsonData), '{"test":"test"}');
        done(false);
      } catch (e) { done(e); }
    });
  });
};

unit['data.delete basic'] = function (done) {
  _data.delete('test', 'unitDataCRUD', function (err) {
    try {
      assert.equal(err, null);
      done(false);
    } catch (e) { done(e); }
  });
};

// Logs.list should callback an array and a false error
unit['logs.list should callback a false error and an array of log names'] =
  function (done) {
    logs.list(true, function (err, logFileNames) {
      try {
        assert.equal(err, false);
        assert.ok(logFileNames instanceof Array);
        assert.ok(logFileNames.length > 1);
        done(false);
      } catch (e) { done(e); }
    });
  };



// USERS
let usersTestData = {};

usersTestData = {
  user: {
    queryStringObject: {
      email: "john@snow.cz"
    },
    headers: {
      token: ''
    },
    payload: {
      email: "john@snow.cz",
      firstName: "john",
      lastName: "snow",
      phone: "0987654321",
      password: "password",
      tosAgreement: true
    }
  },
  userExisting: {
    payload: {
      email: "danny@smith.cz",
      firstName: "danny",
      lastName: "smith",
      phone: "1111111111",
      password: "password",
      tosAgreement: true
    }
  }
};


unit['handlers.users CRUD basic'] =
  async function (done) {
    let pLoad = usersTestData.user;
    try {
      let err, userData, tokenData, res;

      // delete user in case it is left from previous unsuccessful test
      pLoad.method = 'delete';
      [err, userData] = await to(handlers._users.deleteFinal(pLoad.queryStringObject.email), false);

      // users.pos
      pLoad.method = 'post';

      [err, userData] = await to(handlers.usersA(pLoad));
      assert.equal(err, null);
      assert.equal(userData.resCode, 200);

      // tokens.post
      pLoad.method = 'post';
      [err, tokenData] = await to(handlers.tokensA(pLoad));
      assert.equal(tokenData.resCode, 200);
      assert.equal(tokenData.payload.email, pLoad.payload.email);

      pLoad.headers.token = tokenData.payload.id;

      // users.put
      pLoad.method = 'put';
      pLoad.payload.firstName = 'honza';
      [err, userData] = await to(handlers.usersA(pLoad));
      assert.equal(userData.resCode, 200);

      // users.get
      pLoad.method = 'get';
      [err, userData] = await to(handlers.usersA(pLoad));
      assert.equal(userData.resCode, 200);
      assert.equal(userData.payload.email, pLoad.payload.email);
      assert.equal(userData.payload.firstName, 'honza');

      // users.delete
      pLoad.method = 'delete';
      [err, userData] = await to(handlers.usersA(pLoad));
      assert.equal(err, null);
      assert.equal(userData.resCode, 200);

      //throwing out token
      [err, res] = await to(handlers._tokens.deleteFinal(tokenData.payload.id));
      assert.equal(err, null);
      assert.equal(res.resCode, 200);
      done();
    } catch (e) { done(e); }

  };

unit['handlers.tokens CRUD basic'] =
  async function (done) {
    let pLoad = usersTestData.userExisting;
    try {
      let err, resO, tokenOK, tokenData;

      pLoad.method = 'post';
      // tokens.post
      [err, resO] = await to(handlers.tokensA(pLoad));
      assert.equal(resO.resCode, 200);
      assert.equal(resO.payload.email, pLoad.payload.email);

      [err, tokenOK] = await to(handlers._tokens.verifyTokenA(resO.payload.id, resO.payload.email));
      assert.equal(err, null);
      assert.equal(tokenOK, true);

      let data = {
        method: 'get',
        queryStringObject: {
          id: resO.payload.id,
          extend: true
        }
      };

      // tokens.get
      [err, resO] = await to(handlers.tokensA(data));
      assert.equal(err, null);
      assert.equal(resO.resCode, 200);
      assert.equal(resO.payload.email, pLoad.payload.email);

      let dataPut = {
        method: 'put',
        "payload": {
          "id": resO.payload.id,
          "extend": true
        }
      };

      // tokens.put
      [err, resO] = await to(handlers.tokensA(dataPut));
      assert.equal(err, null);
      assert.equal(resO.resCode, 200);

      // tokens.delete
      data.method = 'delete';
      [err, resO] = await to(handlers.tokensA(data));
      assert.equal(err, null);
      assert.equal(resO.resCode, 200);

      // tokens.get
      data.method = 'get';
      [err, resO] = await to(handlers.tokensA(data));
      assert.equal(err, null);
      assert.equal(resO.resCode, 400);

      done();
    } catch (e) { done(e); }
  };


// Checks

let checksData = {
  method: 'post',
  payload: {
    "email": "danny@smith.cz",
    "protocol": "http",
    "url": "google.com",
    "method": "get",
    "successCodes": [
      200,
      201,
      301,
      302
    ],
    "timeoutSeconds": 3
  },
  "headers": {
    "token": "testToken"
  },
  queryStringObject: {}
};

unit['handlers.checks CRUD basic'] =
  async function (done) {
    let data = checksData;
    try {
      let err, resO;

      // checks.post
      data.method = 'post';
      [err, resO] = await to(handlers.checksA(data));
      assert.equal(err, null);
      assert.equal(resO.payload.email, checksData.payload.email);

      // checks.get
      data.method = 'put';
      data.queryStringObject.id = resO.payload.id;
      data.payload.id = resO.payload.id;
      delete data.payload.email;
      delete data.payload.protocol;
      delete data.payload.method;
      delete data.payload.successCodes;
      delete data.payload.timeoutSeconds;
      data.payload.url = "twitter.com";
      resO = {};
      [err, resO] = await to(handlers.checksA(data));
      assert.equal(err, null);

      // checks.get
      data.method = 'get';
      resO = {};
      [err, resO] = await to(handlers.checksA(data));
      assert.equal(err, null);
      assert.equal(resO.payload.url, "twitter.com");

      // checks.delete
      data.method = 'delete';
      data.queryStringObject = {};
      data.queryStringObject.id = resO.payload.id;
      resO = {};
      [err, resO] = await to(handlers.checksA(data));
      assert.equal(err, null);
      assert.equal(resO.resCode, 200);

      done();
    } catch (e) { done(e); }
  };


let checkData = {
  "id": "uzq2bb1t26cyhxvw5pm8",
  "email": "danny@smith.cz",
  "protocol": "https",
  "url": "google.com",
  "method": "get",
  "successCodes": [
    200,
    201,
    301,
    302
  ],
  "timeoutSeconds": 3
};

unit['performCheck basic test'] =
  async function (done) {
    let err, checkOutcome;
    try {
      [err, checkOutcome] = await to(_checks.performCheck(checkData));
      assert.equal(err, null);
      done();
    } catch (e) { done(e); }
  };



// // Logs.truncate should not throw if the logId does not exist
// unit['logs.truncate should not throw if the logId does not exist, should callback an error instead'] = function(done){
//   assert.doesNotThrow(function(){
//     logs.truncate('I do not exist',function(err){
//       assert.ok(err);
//       done();
//     })
//   },TypeError);
// };

// // exampleDebuggingProblem.init should not throw (but it does)
// unit['exampleDebuggingProblem.init should not throw when called'] = function(done){
//   assert.doesNotThrow(function(){
//     exampleDebuggingProblem.init();
//     done();
//   },TypeError);
// };

// Export the tests to the runner
module.exports = unit;
