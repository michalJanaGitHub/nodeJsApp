// to.js
// https://blog.grossman.io/how-to-write-async-await-without-try-catch-blocks-in-javascript/

const fs = require('fs');
const util = require('util');
const config = require('./config');
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
        console.log('\x1b[31m%s\x1b[0m', dateStr.toString());
        console.log(err);
        console.log('');
      }
      
      return [err];
    });
};