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

unit['handlers.users.post basic'] =
function (done) {
  let Payload = {
    payload: {
      firstName: "john",
      lastName: "snow",
      phone: "0987654321",
      password: "password",
      tosAgreement: true
    }
  };

  handlers._users.post(Payload, async(statusCode, data) => {
      try {
        let err, userData;
    [err, userData] = await to(_data.readA('users', Payload.payload.phone));
    [err] = await to(_data.deleteA('users', Payload.payload.phone));
    assert.equal(statusCode, 200);
    assert.equal(err, null);
    assert.equal(userData.phone, Payload.payload.phone);
    done();
  } catch (e) { done(e); }
  
  });
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
