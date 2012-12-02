
var args        = process.argv.splice(2)
  , configFile  = args[0] || './config.json'
  , fs          = require('fs')
  , userconfig  = JSON.parse(fs.readFileSync(configFile, 'utf8'))
  , config      = require('../config')(userconfig)
  , redisLoader = require(application_root+"/lib/redis");

redisLoader.autoload({}, config.database.redis, function(err, redis) {
    redis.createClient().flushdb(function(err) {
        console.log(err || "ok");
        process.exit(0);
    });
});

