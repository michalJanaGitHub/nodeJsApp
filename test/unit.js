/*
 * Unit Tests
 *
 */

// Dependencies
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
    payload: {
      firstName: "john",
      lastName: "snow",
      phone: "0987654321",
      password: "password",
      tosAgreement: true
    }
  },
  userExisting: {    
    payload: {
      firstName: "danny",
      lastName: "smith",
      phone: "1111111111",
      password: "password",
      tosAgreement: true
    }
  }
};


unit['handlers.users.post basic'] =
function (done) {
  let pLoad = usersTestData.user;

  handlers._users.post(pLoad, async(statusCode, data) => {
  try {
    let err, userData;
    [err, userData] = await to(_data.readA('users', pLoad.payload.phone));
    [err] = await to(_data.deleteA('users', pLoad.payload.phone));
    assert.equal(statusCode, 200);
    assert.equal(err, null);
    assert.equal(userData.phone, pLoad.payload.phone);
    done();
  } catch (e) { done(e); }
  
  });
};


// unit['handlers.tokens.post basic'] =
// function (done) {
//   let pLoad = usersTestData.userExisting;

//   handlers._tokens.post(pLoad, (statusCode, tokenObject) => {
//     try {
//       handlers._tokens.verifyToken(tokenObject.id, tokenObject.phone, (tokenOK) => {
//         assert.equal(statusCode, 200);
//         assert.equal(tokenObject.phone, pLoad.payload.phone);
//         assert.equal(tokenOK, true);
//       });

//     done();
//   } catch (e) { done(e); }

//   });
// };

unit['handlers.tokens CRUD basic'] =
async function (done) {
  let pLoad = usersTestData.userExisting;
  try {
    let err, resO, tokenOK;

    pLoad.method = 'post';

    [err, resO] = await to (handlers.tokensA(pLoad));
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

    [err, resO] = await to(handlers.tokensA(dataPut));
    assert.equal(err, null);
    assert.equal(resO.resCode, 200);

    data.method = 'delete';

    [err, resO] = await to(handlers.tokensA(data));
    assert.equal(err, null);   
    assert.equal(resO.resCode, 200);

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
