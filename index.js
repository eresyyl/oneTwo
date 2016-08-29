'use strict'

let MyRedis = require('./myRedis.js');
let Worker = require('./Worker.js');

let worker = new Worker(new MyRedis());

let mode = process.argv[2];

worker.start(mode);
