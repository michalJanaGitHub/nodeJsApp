/*
 * Test runner
 *
 */

// Override the NODE_ENV variable
process.env.NODE_ENV = 'testing';

// Application logic for the test runner
_app = {};

// Holder of all tests
_app.tests = {};

// Dependencies
_app.tests.unit = require('./unit');
_app.tests.api = require('./api');
to = require('./../lib/to');


// Run the tests
runTests();

// Run all the tests, collecting the errorsArr and successfulTests
function runTests() {
  let errorsArr = [];
  let successfulTests = 0;
  let testsCount = 0;
  let noOfTestsRun = 0;

  console.log("");
  console.log("");
  console.log("------------BEGIN TEST-----------");
  console.log("");

  cycleTests(_app.tests);

  function cycleTests(testsObject) {
    Object.keys(testsObject).map(subTests => {
      Object.keys(testsObject[subTests]).map(test => {
        testsCount++;
        testsObject[subTests][test](function (err) {
          logWhenFinished(test, err);
        });
      });
    });
  }

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
    noOfTestsRun++;
    if (noOfTestsRun == testsCount)
      produceTestReport(testsCount, successfulTests, errorsArr);
  }

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
  console.log("Pass: ", successfulTests);
  console.log("Fail: ", errorsArr.length);
  console.log("");
  console.log("----------END TEST REPORT----------");
  console.log("");
  console.log("");

  process.exit(0);
}

