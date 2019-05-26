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
const to = require('./../lib/to');
const handlers = require('./../lib/handlers');

// Holder for Tests
let unit = {};

unit['data.Async CRUD'] = async function (done) {
  let err, data;

  if (!err) [err]       = await to(_data.createA('test', 'uniAsyncCRUD', { "test": "test" }));
  if (!err) [err]       = await to(_data.updateA('test', 'uniAsyncCRUD', { "update": "update" }));
  if (!err) [err, data] = await to(_data.readA('test', 'uniAsyncCRUD'));
  if (!err) [err]       = await to(_data.deleteA('test', 'uniAsyncCRUD'));

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
      phone: "0987654321"
    },
    headers: {
      token: ''
    },
    payload: {
      login: "john@snow.cz",
      firstName: "john",
      lastName: "snow",
      phone: "0987654321",
      password: "password",
      tosAgreement: true
    }
  },
  userExisting: {    
    payload: {
      login : "danny@smith.cz",
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
    let err, userData, tokenData;

    
    // delete user in case it is left from previous unsuccessful test
    pLoad.method = 'delete';
    [err, userData] = await to(handlers.usersA(pLoad));


    // users.post
    pLoad.method = 'post';

    [err, userData] = await to(handlers.usersA(pLoad));
    assert.equal(err, null);
    assert.equal(userData.resCode, 200);

    // tokens.post
    pLoad.method = 'post';
    [err, tokenData] = await to (handlers.tokensA(pLoad));
    assert.equal(tokenData.resCode, 200);
    assert.equal(tokenData.payload.phone, pLoad.payload.phone);

    pLoad.headers.token = tokenData.payload.id;

    // users.put
    pLoad.method = 'put';
    pLoad.payload.firstName = 'honza';
    [err, userData] = await to (handlers.usersA(pLoad));
    assert.equal(userData.resCode, 200);

    // users.get
    pLoad.method = 'get';
    [err, userData] = await to (handlers.usersA(pLoad));
    assert.equal(userData.resCode, 200);
    assert.equal(userData.payload.phone, pLoad.payload.phone);
    assert.equal(userData.payload.firstName, 'honza');
    
    // users.delete
    pLoad.method = 'delete';
    [err, userData] = await to(handlers.usersA(pLoad));
    assert.equal(err, null);
    assert.equal(userData.resCode, 200);

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
    assert.equal(resO.payload.phone, pLoad.payload.phone);
    
    [err, tokenOK] = await to(handlers._tokens.verifyTokenA(resO.payload.id, resO.payload.phone));
    assert.equal(err, null);
    assert.equal(tokenOK, true);

    let data = {
      method: 'get',
      queryStringObject : {
        id: resO.payload.id,
        extend: true
      }
    };

    // tokens.get
    [err, resO] = await to(handlers.tokensA(data));
    assert.equal(err, null);
    assert.equal(resO.resCode, 200);
    assert.equal(resO.payload.phone, pLoad.payload.phone);

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
