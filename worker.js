'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var async = require('async');

var Worker = function () {
  //Base functions
  function Worker(redis) {
    _classCallCheck(this, Worker);

    this.mode = 'emitter' || 'listener';
    this.redis = redis;
    this.emit_interval = 1;
    this.check_interval = 1000;
  }

  _createClass(Worker, [{
    key: 'start',
    value: function start(mode) {
      var _this2 = this;

      if (mode == 'getErrors') {
        this.showErrors();
        return;
      }

      this.redis.get('last_message:time', function (err, time) {
        var now = Date.now();
        if (now - time > _this2.emit_interval * 200) mode = 'emitter';
        _this2.switchMode(mode || 'listener');
      });
    }
  }, {
    key: 'switchMode',
    value: function switchMode(mode) {
      var emit = mode == 'emitter';
      this.listen(!emit);
      this.emit(emit);
    }
  }, {
    key: 'readOldMessages',
    value: function readOldMessages(eventHandler, callback) {
      var _this = this;
      var run = true;
      async.whilst(function () {
        return run;
      }, function (cb) {
        _this.redis.lpop('messages', function (err, messages) {
          if (messages) {
            eventHandler(messages, _this.handleError.bind(_this));
          } else {
            run = false;
          }
          cb(err, messages);
        });
      }, function (err, result) {
        console.log('Queue drained; Sub done');
      });

      callback();
    }
    //Emitter functions

  }, {
    key: 'emit',
    value: function emit(start) {
      var _this3 = this;

      if (!start) {
        this.emitter_id && clearInterval(this.emitter_id);
        this.redis.unsubscribe('revolution');
        console.log('listen');
        return;
      }
      this.redis.publish('revolution', 'test!', function (err) {
        console.log('Publish to revolution');
        _this3.redis.subscribe('revolution', function (message) {
          console.log('Subscribe on revolution');
          _this3.switchMode('listener');
        });
        _this3.redis.set('last_message:time', Date.now(), function (err) {
          return _this3.redis.set('election_counter', 0);
        });
      });

      this.emitter_id = setInterval(this._send.bind(this), this.emit_interval);
    }
  }, {
    key: '_send',
    value: function _send() {
      var _this4 = this;

      var message = this.getMessage();
      //do not forget add multi
      this.redis.publish('notice', 'new message', function (err) {
        console.log('new last_message:time: ' + Date.now());
        _this4.redis.set('last_message:time', Date.now(), function (err) {
          console.log('Push message:' + message);
          _this4.redis.rpush('messages', message);
        });
      });
    }
  }, {
    key: 'eventHandler',
    value: function eventHandler(message, handler) {
      function onComplete() {
        console.log('got ya!', message);
        var error = Math.random() > 0.85;
        handler(error, message);
      }
      // processing takes time...

      setTimeout(onComplete, Math.floor(Math.random() * 1000));
    }
  }, {
    key: 'getMessage',
    value: function getMessage() {
      this.cnt = this.cnt || 0;
      return this.cnt++;
    }
    //Listener functions  

  }, {
    key: 'listen',
    value: function listen(start) {
      if (!start) {
        this.checker_id && clearInterval(this.checker_id);
        this.redis.unsubscribe('notice');
        console.log('emit');
        return;
      }

      var read = this.readOldMessages.bind(this, this.eventHandler.bind(this));
      var _this = this;

      async.waterfall([function (cb) {
        read(cb);
      }, function (cb) {
        _this.redis.subscribe('notice', function (message) {
          _this.redis.lpop('messages', function (err, message) {
            if (message) _this.eventHandler(message, _this.handleError.bind(_this));
          });
        });
      }], function () {
        cb();
      });

      this.checker_id = setInterval(this.checkEmitter.bind(this), this.check_interval);
    }
  }, {
    key: 'checkEmitter',
    value: function checkEmitter() {
      var _this5 = this;

      this.redis.get('last_message:time', function (err, time) {
        var now = Date.now();
        console.log(now - time);
        if (now - time > _this5.emit_interval * 200) _this5.selfElect();
      });
    }
  }, {
    key: 'selfElect',
    value: function selfElect() {
      console.log('time is out');
      var _this = this;
      async.waterfall([function (cb) {
        _this.canElect(cb);
      }, function (canElect, cb) {
        canElect && _this.switchMode('emitter');cb(canElect);
      }], function (err, result) {
        console.log('Election', result ? 'ok' : 'failed');
      });
    }
  }, {
    key: 'canElect',
    value: function canElect(callback) {
      this.redis.incr('election_counter', function (err, counter_value) {
        return callback(err, counter_value === 1);
      });
    }
  }, {
    key: 'handleError',
    value: function handleError(error, message) {
      if (error && message) {
        console.log('Get error on message: ' + message);
        this.redis.rpush('errors', message);
      }
    }
  }, {
    key: 'showErrors',
    value: function showErrors() {
      var _this = this;
      var run = true;
      async.whilst(function () {
        return run;
      }, function (callback) {
        _this.redis.lpop('errors', function (err, messages) {
          if (messages) {
            console.log(messages);
          } else {
            run = false;
          }
          callback(err, messages);
        });
      }, function () {
        process.exit();
        console.log('All errors have been shown!');
      });
    }
  }]);

  return Worker;
}();

module.exports = Worker;
