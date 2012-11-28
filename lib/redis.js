
var redis = require('redis');

exports.autoload = function(model, redisConfig, callback) {
    
    model.redis = {
        createClient: function() {
            var client = redis.createClient(redisConfig.port, redisConfig.host, redisConfig.options);
            if(redisConfig.password) client.auth(redisConfig.password);
            return client;
        }
    };

    callback && callback(null, model.redis);
    
}

