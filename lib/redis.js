
var redis = require('redis');

exports.autoload = function(redisConfig, callback) {
    
    var myRedis = {
        createClient: function() {
            var client = redis.createClient(redisConfig.port, redisConfig.host);
            if(redisConfig.password) client.auth(redisConfig.password);
            return client;
        }
    };

    callback && process.nextTick(function() { callback(null, myRedis); });
    
    return myRedis;
    
}

