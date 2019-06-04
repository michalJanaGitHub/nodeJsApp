/*
 * Module for validating inputs
 *
 */

let lib = {};

lib.array = function (arr) {
  arr = typeof (arr) === 'object' && arr instanceof Array ? arr : false;
  return arr;
};

lib.arrayNonempty = function (arr) {
  arr = typeof (arr) === 'object' && arr instanceof Array && arr.length > 0 ? arr : false;
  return arr;
};

lib.booleanSimple = function (boolVar) {
  boolVar = typeof (boolVar) === 'boolean' && boolVar === true ? true : false;
  return boolVar;
};

lib.checkId = function (str) {
  str = typeof (str) === 'string' && str.trim().length === 20 ? str.trim() : false;
  return str;
};

lib.checksProtocol = function (protocol) {
  protocol = typeof (protocol) === 'string' && ['https', 'http'].indexOf(protocol.trim()) > -1 ? protocol.trim() : false;
  return protocol;
};

lib.checksSuccessCodes = function (codeArray) {
  return lib.arrayNonempty(codeArray);
};

lib.checksTimeoutSeconds = function (timeoutSeconds) {
  timeoutSeconds =
    typeof (timeoutSeconds) === 'number' &&
    timeoutSeconds % 1 === 0 &&
    timeoutSeconds >= 1 &&
    timeoutSeconds <= 5 ? timeoutSeconds : false;
  return timeoutSeconds;
};

lib.checksUrl = function (url) {
  url = typeof (url) === 'string' && url.trim().length > 0 ? url.trim() : false;
  return url;
};

lib.CRUDMethod = function (method) {
  method = typeof (method) ===
    'string' && ['post', 'get', 'put', 'delete'].indexOf(method.trim()) > -1 ? method.trim() : false;
  return method;
};

lib.emailAddress = function (email) {
  let pattern = new RegExp(/^[a-z0-9](\.?[a-z0-9_-]){0,}@[a-z0-9-]+\.([a-z]{1,6}\.)?[a-z]{2,6}$/g);
  email = typeof (email) === 'string' && pattern.test(email.trim()) ? email.trim() : false;
  return email;
};

lib.firstName = function (name) {
  name = typeof (name) === 'string' && name.trim().length > 1 ? name.trim() : false;  
  return name;
};

lib.isCRUDMethod = function (method) {
  method = typeof (method) ===
    'string' && ['post', 'get', 'put', 'delete'].indexOf(method.trim()) > -1 ? true : false;
  return method;
};

lib.lastName = lib.firstName;

lib.password = function (str) {
  str = typeof (str) === 'string' && str.trim().length > 6 ? str.trim() : false;
  return str;
};

lib.phone = function (str) {
  str = typeof (str) === 'string' && str.trim().length > 8 ? str.trim() : false;
  return str;
};

lib.stringSimple = function (str, len = 0) {
  str = typeof (str) === 'string' && str.trim().length > len ? str.trim() : false;
  return str;
};

lib.token = function (str) {
  str = typeof (str) === 'string' && str.trim().length === 20 ? str.trim() : false;
  return str;
};

module.exports = lib;


 
