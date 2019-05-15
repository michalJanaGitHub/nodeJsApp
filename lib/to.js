// to.js
// https://blog.grossman.io/how-to-write-async-await-without-try-catch-blocks-in-javascript/

module.exports = function (promise) {
  return promise.then(data => {
     return [null, data];
  })
  .catch(err => [err]);
};