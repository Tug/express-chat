
var redis = require('redis');
var config = require('../config.js')();
var options = config.database.redis;
var client = redis.createClient(options.port, options.host);
if(options.password) client.auth(options.password);
client.flushdb(function(err) {
    console.log(err || "ok");
    process.exit(0);
});
