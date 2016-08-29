'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('events');
var redis = require('redis');

var myRedis = function (_EventEmitter) {
  _inherits(myRedis, _EventEmitter);

  function myRedis(options) {
    _classCallCheck(this, myRedis);

    var _this = _possibleConstructorReturn(this, (myRedis.__proto__ || Object.getPrototypeOf(myRedis)).call(this));

    _this.client = redis.createClient(options);
    _this.listener = redis.createClient(options);
    _this.listener.on('message', function (ch, m) {
      return _this.emit(ch, m);
    });
    return _this;
  }

  _createClass(myRedis, [{
    key: 'subscribe',
    value: function subscribe(channel, callback) {
      this.listener.subscribe(channel);
      this.on(channel, callback);
    }
  }, {
    key: '_handle',
    value: function _handle(handler, method, args) {
      if (handler[method] && handler[method].constructor === Function) return handler[method].apply(handler, args);else throw new Error('No such method' + method);
    }
    //Client

  }, {
    key: 'incr',
    value: function incr() {
      return this._handle(this.client, 'incr', arguments);
    }
  }, {
    key: 'get',
    value: function get() {
      return this._handle(this.client, 'get', arguments);
    }
  }, {
    key: 'set',
    value: function set() {
      return this._handle(this.client, 'set', arguments);
    }
  }, {
    key: 'rpush',
    value: function rpush() {
      return this._handle(this.client, 'rpush', arguments);
    }
  }, {
    key: 'lpop',
    value: function lpop() {
      return this._handle(this.client, 'lpop', arguments);
    }
  }, {
    key: 'publish',
    value: function publish() {
      return this._handle(this.client, 'publish', arguments);
    }
    //Listener

  }, {
    key: 'unsubscribe',
    value: function unsubscribe() {
      return this._handle(this.listener, 'unsubscribe', arguments);
    }
  }]);

  return myRedis;
}(EventEmitter);

module.exports = myRedis;
