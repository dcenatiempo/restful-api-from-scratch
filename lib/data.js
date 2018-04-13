// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers')

// Container for the module (to be exported)
var lib = {};

// Define base directiory
lib.baseDir = path.join(__dirname, '/../.data')
// Write data to a file
lib.create = (dir, file, data, callback) => {
  // Open the file for writing
  fs.open(`${lib.baseDir}/${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      // Convert data to string
      var stringData = JSON.stringify(data);

      // Write to file and close it
      fs.writeFile(fileDescriptor, stringData, (err) => {
        if(!err) {
          fs.close(fileDescriptor, (err) => {
            if(!err) {
              callback(false);
            } else callback('Error closing new file');
          });
        } else callback('Error writing to new file.');
      });
    } else callback('Could not create new file, it may already exist.');
  });
}

// Read data from a file
lib.read = (dir, file, callback) => {
  fs.readFile(`${lib.baseDir}/${dir}/${file}.json`, 'utf-8', (err, data) => {
    if (!err && data) {
      var parsedData = helpers.parseJsonToObject(data);
      callback (false, parsedData)
    } else callback(err, data);
  })
};

// Update an existing file
lib.update = (dir, file, data, callback) => {
  fs.open(`${lib.baseDir}/${dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      var stringData = JSON.stringify(data);
      fs.truncate(fileDescriptor, (err) => {
        if (!err) {
          fs.writeFile(fileDescriptor, stringData, (err) => {
            if (!err) {
              fs.close(fileDescriptor, (err) => {
                if (!err) {
                  callback(false);
                } else callback('Error closing the file.')
              });
            } else callback('Error writing to existing file.')
          });
        } else callback('Error truncating file');
      });
    } else callback('Could not open the file for updating. It may not exist yet.');
  });
};

lib.delete = (dir, file, callback) => {
  // Unlinking
  fs.unlink(`${lib.baseDir}/${dir}/${file}.json`, (err) => {
    if (!err) {
      callback(false);
    } else callback('Error deleting file.');
  })
};

// Export
module.exports = lib;