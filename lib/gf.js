/*
 * General purpose functions to be used in other modules
 *
 */

const fsp = require('./fsP');
const path = require('path');

let lib = {};

async function appendFile(fileName, str, dir = '/.logs/') {
  let err, fileDesc;
  if (dir.substring(0, 1) === '/') dir = path.join(config.baseDir, dir);
  if (dir.split("").reverse().join("") !== '/') dir = path.join(dir, '/');
  if (path.extname(fileName) == '') fileName += '.log';
  
  let fPath = dir + fileName;
  [err, fileDesc] = await to(fsp.open(fPath, 'a'));
  if (err) throw new Error('Could not open file for appending');
    
  str += '\n';
  let buffer = Buffer.from(str);
  [err] = await to(fsp.appendFile(fileDesc, buffer));
  if (err) throw new Error('Error appending to file');

  [err] = await to(fsp.close(fileDesc));
  if (err) throw new Error('Error closing file that was being appended');
}
lib.appendFile = appendFile;


module. exports = lib;
