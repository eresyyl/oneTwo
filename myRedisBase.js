'use strict'

let EventEmitter = require('events');
let redis = require('redis');

class myRedisBase extends  EventEmitter {
  constructor(options){
    super();
    this.client = redis.createClient(options);
    this.listener = redis.createClient(options);
    this.listener.on('message', (ch,m) => this.emit(ch,m));
  }
  subscribe(channel, callback){
    this.listener.subscribe(channel);
    this.on(channel, callback);
  }
  _handle(handler, method, args){
    if( handler[method] && handler[method].constructor === Function)
      return handler[method].apply(handler, args);
    else
      throw new Error('No such method' + method);
  }
  //Client
  incr(){
    return this._handle(this.client, 'incr', arguments);
  }
  get(){
    return this._handle(this.client, 'get', arguments);
  }
  set(){
    return this._handle(this.client, 'set', arguments);
  }
  rpush(){
    return this._handle(this.client, 'rpush', arguments);
  }  
  lpop(){
    return this._handle(this.client, 'lpop', arguments);
  }
  publish(){
    return this._handle(this.client, 'publish', arguments);
  }
  //Listener
  unsubscribe(){
    return this._handle(this.listener, 'unsubscribe', arguments);
  }
}

module.exports = myRedisBase;