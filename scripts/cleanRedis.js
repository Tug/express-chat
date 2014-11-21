
var userconfig = require('../loadConfig');

require('../loadApp')(userconfig, function(err, app, model, config) {

    var redisClient = model.redis.createClient();
    flush(redisClient);

    function flush(redisClient) {
        redisClient.flushdb(function(err) {
            console.log(err || "ok");
            process.exit(0);
        });
    }

});