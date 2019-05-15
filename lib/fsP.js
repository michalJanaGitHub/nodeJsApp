const fs = require('fs');
const util = require('util');

let lib = {};

lib.open = util.promisify(fs.open);
lib.writeFile = util.promisify(fs.writeFile);
lib.close = util.promisify(fs.close);
lib.readFile = util.promisify(fs.readFile);
lib.unlink = util.promisify(fs.unlink);
lib.truncate = util.promisify(fs.truncate);
lib.ftruncate = util.promisify(fs.ftruncate);

module.exports = lib;