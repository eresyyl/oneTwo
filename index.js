'use strict'

let MyRedis = require('./myRedisBase.js');
let Worker = require('./WorkerBase.js');

let worker = new Worker(new MyRedis());

let mode = process.argv[2];

worker.start(mode);
