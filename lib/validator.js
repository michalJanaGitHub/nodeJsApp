/*
 * Module for validating inputs
 *
 */

let lib = {};


lib.booleanSimple = function (boolVar) {
  boolVar = typeof (boolVar) === 'boolean' && boolVar === true ? true : false;
  return boolVar;
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

lib.instanceOfArray = function (arr) {
  arr = typeof (arr) === 'object' && arr instanceof Array ? arr : [];
  return arr;
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
 
