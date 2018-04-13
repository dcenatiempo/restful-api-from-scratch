// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
// Define Handlers
var handlers = {};

handlers.notFound = (data, callback) => {
  callback(404);
};

handlers.ping = (data, callback) => {
  callback(200);
};

handlers.users = (data, callback) => {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data,callback);
  } else callback(405);
};
// container for users submethods
handlers._users = {};

// Required data: firstName, lastName, phone, password, tosAgreement
handlers._users.post = (data, callback) => {

  var firstName =typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;

  var lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;

  var phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;

  var password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  var tosAgreement = typeof(data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement === true ? true : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // make sure that the user doesn't already exist
    _data.read('user', phone, (err, data) => {
      if (err) {
        // Hash the password
        var hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          var userObject = {
            'firstName': firstName,
            'lastName': lastName,
            'phone': phone,
            'hashedPassword': hashedPassword,
            'tosAgreement': true
          };
  
          _data.create('users', phone, userObject, (err) => {
            if (!err) callback(200);
            else {
              console.log(err);
              callback(500, {'Error':'Could not create the new user'});
            }
          });
        } else callback(500, {'Error': 'Could not hash password.'});
      } else callback(400, {'Error': 'User with phone number already exists.'});
    });
  } else callback(400, {'Error': 'Missing required fields.'});
};

// Required Data: phone
// TODO: only let authenticated use access only their object
handlers._users.get = (data, callback) => {
  // Check that phone number is valid
  var phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    // Lookup the user
    _data.read('users', phone, (err, data) => {
      if (!err && data) {
        // Remove the hashed password from user object before returning
        delete data.hashedPassword;
        callback (200, data);
      } else callback(404);
    });
  } else callback(400, {'Error': 'Missing required field.'});
};

// Required data: phone
// Optional data: firstName, lastName, password
// TODO: only let authenticated user update their own object
handlers._users.put = (data, callback) => {
  // check for required field
  var phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
  var firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim() ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim() ? data.payload.lastName.trim() : false;
  var password = typeof(data.payload.password) === 'string' && data.payload.password.trim() ? data.payload.password.trim() : false;

  if (phone) {
    if (firstName || lastName || password) {
      _data.read('users', phone, (err, userData) => {
        if (!err && userData) {
          if (firstName) {
            userData.firstName = firstName;
          }
          if (lastName) {
            userData.lastName = lastName;
          }
          if (password) {
            userData.hashedPassword = helpers.hash(password);
          }
          _data.update('users', phone, userData, err => {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, {"Error": "Could not update user"});
            }
          })
        } else callback(400, {"Error": "The user does not exist."});
      });
    } else callback(400, {"Error": "Missing fields to update."});
  } else callback(400, {"Error": "Missing required field."});
};

// Required field: phone
// TODO: only let authenticated user delete their own object
// TODO: cleanup any other data files associate with this user
handlers._users.delete = (data, callback) => {
  // Check that phone is valid
  var phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    // Lookup the user
    _data.read('users', phone, (err, data) => {
      if (!err && data) {
        _data.delete('users', phone, err => {
          if (!err) callback (200);
          else callback(500, {"Error": "Could not delete specified user"});
        });
      } else callback(400, {"Error": "Could not find the specified user."});
    });
  } else callback(400, {'Error': 'Missing required field.'});
};

// Export Handlers
module.exports = handlers;