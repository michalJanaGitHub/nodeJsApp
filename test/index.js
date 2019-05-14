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

// Count all the tests
_app.countTests = function () {
  var noOfTestsRun = 0;
  for (var key in _app.tests) {
    if (_app.tests.hasOwnProperty(key)) {
      let subTests = _app.tests[key];
      for (var testName in subTests) {
        if (subTests.hasOwnProperty(testName) && testName !== 'runTest') {
          noOfTestsRun++;
        }
      }
    }
  }
  return noOfTestsRun;
};

// Run all the tests, collecting the errCount and successfulTests
_app.runTests = function () {
  let errCount = [];
  let successfulTests = 0;
  let testsCount = _app.countTests();
  let noOfTestsRun = 0;

  
  cycleTests();
  
  function cycleTests (callback) {
    for (var key in _app.tests) {
      if (_app.tests.hasOwnProperty(key)) {
        cycleSubTests (key);
      }
    }
    // callback();
  }

  function cycleSubTests(key) {
    let subTests = _app.tests[key];
    for (var testName in subTests) {
      if (subTests.hasOwnProperty(testName)) {
        if (testName !== 'runTest') runTest(testName, subTests);
      }
    }
  }  

  function runTest(testName, subTests) {
    let testValue = subTests[testName];
    // Call the test
    testValue( (res) => {
      if (res === false) whenDone(testName);
      else whenFailed(testName, res);
    });
  }

  function whenDone(testName){
    console.log('\x1b[32m%s\x1b[0m', testName);
    noOfTestsRun++;
    successfulTests++;
    if (noOfTestsRun == testsCount) {
      _app.produceTestReport(testsCount, successfulTests, errCount);
    }
  }
  
  function whenFailed(testName, err) {
     // If it throws, then it failed, so capture the error thrown and log it in red
     errCount.push({
      'name': testName,
      'error': err
    });
    console.log('\x1b[31m%s\x1b[0m', testName);
    noOfTestsRun++;
    if (noOfTestsRun == testsCount) {
      _app.produceTestReport(testsCount, successfulTests, errCount);
    }   
  }

};


// Product a test outcome report
_app.produceTestReport = function (testsCount, successfulTests, errCount) {


  // If there are errors, print them in detail
  if (errCount.length > 0) {
    console.log("--------BEGIN ERROR DETAILS--------");
    console.log("");
    errCount.forEach(function (testError) {
      console.log('\x1b[31m%s\x1b[0m', testError.name);
      console.log(testError.error);
      console.log("");
    });
    console.log("");
    console.log("--------END ERROR DETAILS--------");
  }


  console.log("");
  console.log("--------BEGIN TEST SUMMARY--------");
  console.log("");
  console.log("Total Tests: ", testsCount);
  console.log("Pass: ", successfulTests);
  console.log("Fail: ", errCount.length);
  console.log("");
  console.log("--------END TEST REPORT--------");

  process.exit(0);

};

// Run the tests
_app.runTests();
