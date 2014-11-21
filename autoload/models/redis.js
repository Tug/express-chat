
exports.autoload = function(app, model, redisConfig, callback) {
    
    model.redis = {
        createClient: function() {
            var client = app.libs.redis.createClient(redisConfig.port, redisConfig.host, redisConfig.options);
            if(redisConfig.password) client.auth(redisConfig.password);
            return client;
        }
    };

    callback && callback(null, model.redis);
    
}

