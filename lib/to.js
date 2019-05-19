// to.js
// https://blog.grossman.io/how-to-write-async-await-without-try-catch-blocks-in-javascript/

const fs = require('fs');
const util = require('util');
const config = require('./config');

// Custom logging to file and console
const logFile = fs.createWriteStream(config.errorLog, { flags: 'a' });
  // Or 'w' to truncate the file every time the process starts.
const logStdout = process.stdout;

console.log = function () {
  logFile.write(util.format.apply(null, arguments) + '\n');
  logStdout.write(util.format.apply(null, arguments) + '\n');
};
console.error = console.log;

module.exports = function (promise) {
  return promise
    .then(data => {
      return [null, data];
    })
    .catch((err) => {
      // if (err.toString().substring(0, 6) !== 'Error:')
      let dateStr = new Date();
      if (process.env.NODE_ENV !== 'testing') {
        console.log('\x1b[31m%s\x1b[0m', dateStr.toISOString());
        console.log(err);
        console.log('');
      }
      
      return [err];
    });
};



// getting function name and line number
// https://stackoverflow.com/questions/14172455/get-name-and-line-of-calling-function-in-node-js
// Object.defineProperty(global, '__stack', {
//   get: function() {
//     var orig = Error.prepareStackTrace;
//     Error.prepareStackTrace = function(_, stack) {
//         return stack;
//     };
//     var err = new Error;
//     Error.captureStackTrace(err, arguments.callee);
//     var stack = err.stack;
//     Error.prepareStackTrace = orig;
//     return stack;
//   }
// });
// // Object.defineProperty(global, '__module', {
// //   get: function() {
// //         return __stack[1].getModuleName();
// //     }
// // });
// Object.defineProperty(global, '__line', {
//   get: function() {
//         return __stack[1].getLineNumber();
//     }
// });
// Object.defineProperty(global, '__function', {
//   get: function() {
//           return __stack[1].getFunctionName();
//       }
// });  
// console.log('Module: ', __module);
// console.log('Function: ', __function);
// console.log('Line: ', __line);