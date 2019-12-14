/*
 * Module for validating inputs
 *
 */

let lib = {};

lib.array = function (arr) {
  arr = typeof (arr) === 'object' && arr instanceof Array ? arr : false;
  return arr;
};

lib.arrayNonEmpty = function (arr) {
  arr = typeof (arr) === 'object' && arr instanceof Array && arr.length > 0 ? arr : false;
  return arr;
};

lib.booleanSimple = function (boolVar) {
  boolVar = typeof (boolVar) === 'boolean' && boolVar === true ? true : false;
  return boolVar;
};

lib.checkDataValidateAll = function (checkData) {

  checkData = typeof (checkData) === 'object' && checkData !== null ? checkData : {};
  checkData.id = lib.checkId(checkData.id);
  checkData.userEmail = lib.emailAddress(checkData.userEmail);
  checkData.protocol = lib.checksProtocol(checkData.protocol);
  checkData.url = lib.checksUrl(checkData.url);
  checkData.method = lib.CRUDMethod(checkData.method);
  checkData.successCodes = lib.arrayNonEmpty(checkData.successCodes);
  checkData.timeoutSeconds = lib.numberWhole(checkData.timeoutSeconds, 1, 5);

  // Set the keys that may not be set (if the workers have never seen this check before)
  checkData.state =
    typeof (checkData.state) === 'string' &&
      ['up', 'down'].indexOf(checkData.state) > -1 ? checkData.state : 'down';
  checkData.lastChecked = lib.numberWhole(checkData.lastChecked);

  // If all checks pass, pass the data along to the next step in the process
  if (
    !checkData.id ||
    !checkData.userEmail ||
    !checkData.protocol ||
    !checkData.url ||
    !checkData.method ||
    !checkData.successCodes ||
    !checkData.timeoutSeconds
  ) return false;
  return checkData;
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
  return lib.arrayNonEmpty(codeArray);
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

lib.numberWhole = function (i, lBound=Number.NEGATIVE_INFINITY,uBound = Number.POSITIVE_INFINITY) {
  i = typeof (i) === 'number' && i % 1 === 0 &&
  i >= lBound && i <= uBound ? i : false;
  return i;
};


module.exports = lib;


 
