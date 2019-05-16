/*
 * Promisified fs library
 *
 */

const fs = require('fs');
const util = require('util');

let lib = {};

lib.appendFile  = util.promisify(fs.appendFile);
lib.close       = util.promisify(fs.close);
lib.exists      = util.promisify(fs.existsSync);
lib.ftruncate   = util.promisify(fs.ftruncate);
lib.open        = util.promisify(fs.open);
lib.readFile    = util.promisify(fs.readFile);
lib.truncate    = util.promisify(fs.truncate);
lib.unlink      = util.promisify(fs.unlink);
lib.write       = util.promisify(fs.write);
lib.writeFile   = util.promisify(fs.writeFile);

module.exports = lib;