/*
 * Library for storing and editing data
 *
 */

// Dependencies
const fs = require('fs');
const fsp = require('./fsP');
const path = require('path');
const helpers = require('./helpers');
const util = require('util');
const to = require('./to.js');

const fs_unlink = util.promisify(fs.unlink);


// Container for module (to be exported)
let lib = {};

// Base directory of data folder
lib.baseDir = path.join(__dirname,'/../.data/');

// Write data to a file
lib.create = function(dir, file, data, callback){
  // Open the file for writing
  let pom = lib.baseDir + dir + '/' + file +'.json';
  fs.open(pom, 'wx', function(err, fileDescriptor){
    if(!err && fileDescriptor){
      // Convert data to string
      var stringData = JSON.stringify(data);

      // Write to file and close it
      fs.writeFile(fileDescriptor, stringData,function(err){
        if(!err){
          fs.close(fileDescriptor,function(err){
            if(!err) callback(false);
            else callback('Error closing new file');
          });
        } else callback('Error writing to new file');
      });
    } else callback('Could not create new file, it may already exist');
  });
};

// Write data to a file Async/Await
lib.createA =  async function(dir, file, data){
  let err, fileDescriptor;
  let stringData  = JSON.stringify(data);

  // Open the file for writing
  let pom = path.join(lib.baseDir, dir, file + '.json');  
  [err, fileDescriptor] = await to (fsp.open (pom, 'wx'));
  if(!err) throw new Error('Could not create new file, it may already exist');
  
  // Write to file and close it
  [err] = await to (fsp.writeFile (fileDescriptor, stringData));
  if(err) throw new Error('Error writing to new file');
  
  // Close the file
  [err] = await to (fsp.close (fileDescriptor));
  if (err) throw new Error('Error closing new file');
};

// Read data from a file
lib.read = function (dir, file, callback) {
  let pom = path.join(lib.baseDir, dir, file + '.json');  
  fs.readFile(pom, 'utf8', function(err, data){
    if(!err && data){
      var parsedData = helpers.parseJsonToObject(data);
      callback(false,parsedData);
    } else {
      callback(err, data);
    }
  });
};

// Read data from a file Async/Await
lib.readA = async function(dir, file){
  let err, data;
  let pom = path.join(lib.baseDir, dir, file + '.json');
  [err, data] = await to (fsp.readFile (pom, 'utf8'));
  if (err) throw err;
  else return data;    
};

// Update data in a file
lib.update = function(dir,file,data,callback){
  // Open the file for writing
  let pom = lib.baseDir + dir + '/' + file +'.json';
  fs.open(pom, 'r+', function(err, fileDescriptor){
    if(!err && fileDescriptor){
      // Convert data to string
      var stringData = JSON.stringify(data);

      // Truncate the file
      fs.ftruncate(fileDescriptor,function(err){
        if(!err){
          // Write to file and close it
          fs.writeFile(fileDescriptor, stringData,function(err){
            if(!err){
              fs.close(fileDescriptor,function(err){
                if(!err) callback(false);
                else callback('Error closing existing file');
              });
            } else callback('Error writing to existing file');
          });
        } else callback('Error truncating file');
      });
    } else callback('Could not open file for updating, it may not exist yet');
  });

};

// Delete a file
lib.delete = function(dir, file, callback){

  let pom = path.join(lib.baseDir, dir, file + '.json');
  // Unlink the file from the filesystem
  fs.unlink(pom, err => callback(err));
};
// Delete a file Async/Await
lib.deleteA = async function(dir, file){
  let err;
  // Unlink the file from the filesystem
  let pom = path.join(lib.baseDir, dir, file + '.json');
  [err] = await to ( fs_unlink (pom));
  if (err) throw new Error(err);
};

// List all the items in a directory
lib.list = function(dir,callback){
  fs.readdir(lib.baseDir+dir+'/', function(err,data){
    if(!err && data && data.length > 0){
      var trimmedFileNames = [];
      data.forEach(function(fileName){
        trimmedFileNames.push(fileName.replace('.json',''));
      });
      callback(false,trimmedFileNames);
    } else callback(err,data);
  });
};
// List all the items in a directory
lib.listA = async function (dir) {
  let err, data;
  [err, data] = await to(fsp.readdir(lib.baseDir + dir + '/'));
  if (err) throw err;
};


// Delete a file Async/Await
lib.returnA = async function(){
  return 'a';
};


// Export the module
module.exports = lib;
