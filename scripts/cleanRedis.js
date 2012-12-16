
var args        = process.argv.splice(2)
  , configFile  = args[0] || './config.json'
  , fs          = require('fs')
  , userconfig  = JSON.parse(fs.readFileSync(configFile, 'utf8'))
  , config      = require('../config')(userconfig)
  , autoload    = require('express-autoload');

function flush(redisClient) {
    redisClient.flushdb(function(err) {
        console.log(err || "ok");
        process.exit(0);
    });
}

var model = {}
  , app = {};
autoload(app, model, config, function() {
    var redisClient = model.redis.createClient();
    flush(redisClient);
});
