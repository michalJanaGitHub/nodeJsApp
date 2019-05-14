/*
 * Unit Tests
 *
 */

// Dependencies
const helpers = require('./../lib/helpers.js');
const logs = require('./../lib/logs.js');
const exampleDebuggingProblem = require('./../lib/exampleDebuggingProblem.js');
const assert = require('assert');
const data = require('./../lib/data.js');

// Holder for Tests
let unit = {};

unit['data.create basic'] = function(done){
  data.create('test', 'unitDataCRUD', { 'test': 'test' }, function (err) {
    try {
      assert.equal(err, false);
      done(false);
    } catch (e) { done(e); }
  });
};

unit['data.update basic'] = function(done){
  data.update('test', 'unitDataCRUD', { update: 'update' }, function (err) {
    try {
      assert.equal(err, false);
      done(false);
    } catch (e) { done(e); }
  });
};
unit['data.read basic'] = function(done){
  data.read('test', 'unitDataCRUD', function (err, jsonData) {
    try {
      assert.equal(err, false);
      assert.equal( JSON.stringify(jsonData), JSON.stringify({ update: 'update' }));
      done(false);
    } catch (e) { done(e); }
  });
};

unit['data.delete basic'] = function(done){
  data.delete('test', 'unitDataCRUD', function (err) {
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
