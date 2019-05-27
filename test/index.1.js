/*
 * Test runner - chosen test only
 *
 */


 

let testName = 'handlers.users CRUD basic';

// Override the NODE_ENV variable
// process.env.NODE_ENV = 'testing';

// Dependencies
let _unit = require('./unit');
let _api = require('./api');

let errorsArr = [];
let successfulTests = 0;

console.log("");
console.log("");
console.log("------------BEGIN TEST-----------");
console.log("");

_unit[testName]((err) => logWhenFinished(testName, err));

function logWhenFinished(testName, err) {
  // If it throws, then it failed, so capture the error thrown and log it in red
  if (err) {
    errorsArr.push({
      'name': testName,
      'error': err
    });
    console.log('\x1b[31m%s\x1b[0m', testName);
  } else {
    console.log('\x1b[32m%s\x1b[0m', testName);
    successfulTests++;
  }
  produceTestReport(1, successfulTests, errorsArr);
}

// Product a test outcome report
function produceTestReport(testsCount, successfulTests, errorsArr) {


  // If there are errors, print them in detail
  if (errorsArr.length > 0) {
    console.log("-------BEGIN ERROR DETAILS-------");
    console.log("");
    errorsArr.forEach(function (testError) {
      console.log('\x1b[31m%s\x1b[0m', testError.name);
      console.log(testError.error);
      console.log("");
    });
    console.log("");
    console.log("--------END ERROR DETAILS--------");
  }

  console.log("");
  console.log("--------BEGIN TEST SUMMARY---------");
  console.log("");
  console.log("Total Tests: ", testsCount);
  console.log('\x1b[32m%s\x1b[0m', `Pass: ${successfulTests}`);
  if (errorsArr.length === 0) console.log(`Fail: ${errorsArr.length}`);
  else console.log('\x1b[31m%s\x1b[0m', `Fail: ${errorsArr.length}`);
  console.log("");
  console.log("----------END TEST REPORT----------");
  console.log("");
  console.log("");

  process.exit(0);
}

