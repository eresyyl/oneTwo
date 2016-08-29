'use strict'
var async = require('async');
class WorkerBase {
  //Base functions
  constructor(redis) {
    this.mode = 'emitter' || 'listener';
    this.redis = redis;
    this.emit_interval = 500;
    this.check_interval = 1000;
  }  
  start(mode) {
    if(mode == 'getErrors'){
      this.showErrors();
      return;
    }
    
    this.redis.get('last_message:time', (err, time) => {
      let now = Date.now();
      if (now - time > this.emit_interval * 2)
        mode = 'emitter';
      this.switchMode(mode || 'listener');
    })
  }
  switchMode(mode) {
    let emit = mode == 'emitter';
    this.listen(!emit);
    this.emit(emit);
  }
  readOldMessages(eventHandler, callback) {
    let run = true;
    async.whilst(
      function() {
        return run;
      },
      (cb) => {
        this.redis.lpop('messages', (err, messages) => {
          if(messages){
            eventHandler(messages, this.handleError.bind(this));
          }
          else{
            run = false;
          }
          cb(err, messages)
        })
      },
      function(err,result){
        console.log('Queue drained; Sub done');
      }
    )
    
    callback();
  }
  //Emitter functions
  emit(start) {
    if (!start) {
      this.emitter_id && clearInterval(this.emitter_id);
      this.redis.unsubscribe('revolution');
      console.log('listen');
      return;
    } 
    this.redis.publish('revolution', 'test!', (err) => {
      console.log('Publish to revolution');
      this.redis.subscribe('revolution', (message) => {
        console.log('Subscribe on revolution');
        this.switchMode('listener');
      })
      this.redis.set( 'last_message:time' , Date.now(), (err) => 
          this.redis.set('election_counter', 0 )
      )          
    });
    
    this.emitter_id = setInterval(this._send.bind(this), this.emit_interval);    
  }
  _send() {
    let message = this.getMessage();
    //do not forget add multi
    this.redis.publish('notice', 'new message', (err) => {
      console.log('new last_message:time: ' + Date.now());
      this.redis.set( 'last_message:time' , Date.now(), (err) => { 
        console.log('Push message:' + message);
        this.redis.rpush( 'messages' , message );
      });
    })
  }
  eventHandler(message, handler) {
    function onComplete(){    
      console.log('got ya!', message);
      var error = Math.random() > 0.85;
      handler(error, message);
    }
    // processing takes time...

    setTimeout(onComplete, Math.floor(Math.random()*1000));
  }
  getMessage() {
    this.cnt = this.cnt || 0;
    return this.cnt++;
  }
  //Listener functions  
  listen(start) {
    if (!start) {
      this.checker_id && clearInterval(this.checker_id);
      this.redis.unsubscribe('notice');
      console.log('emit');
      return;
    }
    
    let read = this.readOldMessages.bind(this, this.eventHandler.bind(this));
    
    async.waterfall([
      function(cb){
        read(cb);
      },
      (cb) => {
        this.redis.subscribe('notice', (message) => {
          this.redis.lpop('messages', (err, message) => {
            if(message)
              this.eventHandler(message, this.handleError.bind(this));
          })          
        });
      }
    ], function(){
      cb()
    }); 

    this.checker_id = setInterval(this.checkEmitter.bind(this), this.check_interval);
  }
  checkEmitter() {
    this.redis.get( 'last_message:time', (err, time) => {
      let now = Date.now();
      console.log(now - time);
      if (now - time > this.emit_interval * 2) this.selfElect();
    })
  }
  selfElect() {
    console.log('time is out');
    async.waterfall([
      (cb) => {this.canElect(cb)},
      (canElect,cb) => {canElect && this.switchMode('emitter'); cb(canElect);}
    ], function(err,result){
      console.log('Election', result ? 'ok' : 'failed');
    })
    
  }
  canElect(callback) {
     this.redis.incr( 'election_counter', (err, counter_value) => callback(err,counter_value === 1) )
  }    
  handleError(error, message) {
    if( error && message ){
      console.log('Get error on message: ' + message);
      this.redis.rpush( 'errors' , message );
    }
  }
  showErrors(){
    let run = true;
    async.whilst(
      function() {
        return run;
      },
      (callback) => {
        this.redis.lpop('errors', (err, messages) => {
          if(messages){
            console.log(messages);
          }
          else{
            run = false;
          }
          callback(err, messages)
        })
      },
      function(){
        process.exit();
        console.log('All errors have been shown!');
      }
    )
  }
  
}

module.exports = WorkerBase;
