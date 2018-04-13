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

// Required: phone
// Optional: none
handlers._users.get = (data, callback) => {
  // Check that phone number is valid
  var phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    var token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token, phone, tokenIsValid => {
      if (tokenIsValid) {
        // Lookup the user
        _data.read('users', phone, (err, data) => {
          if (!err && data) {
            // Remove the hashed password from user object before returning
            delete data.hashedPassword;
            callback (200, data);
          } else callback(404);
        });
      } else callback(403, {'Error': 'Missing required token in header or token is invalid'});
    }) 
  } else callback(400, {'Error': 'Missing required field.'});
};

// Required data: phone
// Optional data: firstName, lastName, password
handlers._users.put = (data, callback) => {
  // check for required field
  var phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
  var firstName = typeof(data.payload.firstName) === 'string' ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) === 'string' ? data.payload.lastName.trim() : false;
  var password = typeof(data.payload.password) === 'string' ? data.payload.password.trim() : false;

  if (phone) {
    if (firstName || lastName || password) {
      var token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
      handlers._tokens.verifyToken(token, phone, tokenIsValid => {
        if (tokenIsValid) {
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
                  callback(500, {'Error': 'Could not update user'});
                }
              })
            } else callback(400, {'Error': 'The user does not exist.'});
          });
        } else callback(403, {'Error': 'Missing required token in header or token is invalid'});
      });
    } else callback(400, {'Error': 'Missing fields to update.'});
  } else callback(400, {'Error': 'Missing required field.'});
};

// Required field: phone
// TODO: cleanup any other data files associate with this user
handlers._users.delete = (data, callback) => {
  // Check that phone is valid
  var phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    var token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token, phone, tokenIsValid => {
      if (tokenIsValid) {
        // Lookup the user
        _data.read('users', phone, (err, data) => {
          if (!err && data) {
            _data.delete('users', phone, err => {
              if (!err) callback (200);
              else callback(500, {'Error': 'Could not delete specified user'});
            });
          } else callback(400, {'Error': 'Could not find the specified user.'});
        });
      } else callback(403, {'Error': 'Missing required token in header or token is invalid'});
    });
  } else callback(400, {'Error': 'Missing required field.'});
};

handlers.tokens = (data, callback) => {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data,callback);
  } else callback(405);
};

// container for tokens submethods
handlers._tokens = {};

// Required: phone, password
// Optional: none
handlers._tokens.post = (data, callback) => {
  var phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;

  var password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (phone && password) {
    // lookup user
    _data.read('users', phone, (err, userData) => {
      if (!err) {
        var hashedPassword = helpers.hash(password);
        if (hashedPassword = userData.hashedPassword) {
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            'phone': phone,
            'id': tokenId,
            'expires': expires
          };
          _data.create('tokens', tokenId, tokenObject, err => {
            if (!err) callback(200,tokenObject);
            else callback(500, {'Error': 'Could not create the new token'});
          });
        } else callback(400, {'Error': 'Password did not match the specified users stored password'});
      } else callback(400, {'Error': 'Could not find specified user.'});
    })
  } else callback(400, {'Error': 'Missing required fields.'});
};

// Required: id
// Optional: none
handlers._tokens.get = (data, callback) => {
  var id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
  debugger
  if (id) {
    // Lookup the user
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        // Remove the hashed password from user object before returning
        callback (200, tokenData);
      } else callback(404);
    });
  } else callback(400, {'Error': 'Missing required fields.'});
};

// Required: id, send
// Optional: none
handlers._tokens.put = (data, callback) => {
  var id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false;
  var extend = typeof(data.payload.extend) === 'boolean' && data.payload.extend === true ? true : false;


  if (id && extend) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        if (tokenData.expires > Date.now()) {
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          _data.update('tokens', id, tokenData, err => {
            if (!err) {
              callback(200);
            } else callback(500, {'Error': 'Could not update tokens expiration.'});
          });
        } else callback(400, {'Error': 'The token has already expired'})
      } else callback(400, {'Error': 'The token does not exist.'});
    });
  } else callback(400, {'Error': 'Missing required field(s) or field(s) are invalid.'});
};

// Required: id
// Optional: none
handlers._tokens.delete = (data, callback) => {
  var id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    // Lookup the user
    _data.read('tokens', id, (err, data) => {
      if (!err && data) {
        _data.delete('tokens', id, err => {
          if (!err) callback (200);
          else callback(500, {'Error': 'Could not delete specified token'});
        });
      } else callback(400, {'Error': 'Could not find the specified token.'});
    });
  } else callback(400, {'Error': 'Missing required field.'});
};

handlers._tokens.verifyToken = (id, phone, callback) => {
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      if (tokenData.phone === phone && tokenData.expires > Date.now()) {
        callback(true);
      } else callback(false);
    } else callback(false);
  });
};

// Export Handlers
module.exports = handlers;