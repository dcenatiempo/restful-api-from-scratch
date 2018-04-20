// Dependencies
const assert = require('assert');
const helpers = require('../lib/helpers');
const logs = require('../lib/logs');
const example = require('../lib/throwError');

var unit = {};

/**************** logs ****************/
unit['Logs.list should call back a false error and an array of log names'] = (done) => {
  logs.list(true, (err, logFileNames) => {
    assert.equal(err, false);
    assert.ok(logFileNames instanceof Array);
    assert.ok(logFileNames.length > 1);
    done();
  });
};

unit['logs.truncate should not throw if the logId does not exist. It should callback an error instead.'] = (done) => {
  assert.doesNotThrow( () => {
    logs.truncate('I do not exist', (err) => {
      assert.ok(err);
      done();
    });
  }, TypeError);
};

unit['example.init() should not throw if the logId does not exist. It should callback an error instead.'] = (done) => {
  assert.doesNotThrow( () => {
    example.init();
    done();
  }, TypeError);
};

/**************** helpers ****************/
unit['helpers.getNumber should return a number'] = (done) => {
  var val = helpers.getNumber();
  assert.equal(typeof(val), 'number');
  done();
};

unit['helpers.getNumber should return 1'] = (done) => {
  var val = helpers.getNumber();
  assert.equal(val, 1);
  done();
};

unit['helpers.getNumber should return 2'] = (done) => {
  var val = helpers.getNumber();
  assert.equal(val, 2);
  done();
};

module.exports = unit;