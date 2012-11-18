
var express = require('express');

exports.autoload = function(model, sessionConfig) {
    
    var SessionStore = null;
    var options = null;
    
    switch(sessionConfig.engine) {
        case "mongo":
            SessionStore = require('connect-mongodb');
            options = { db: model.mongo };
            break;
        case "redis":
            SessionStore = require('connect-redis')(express);
            options = { client: model.redis.createClient() };
            break;
        default:
            SessionStore = express.session.MemoryStore;
    }
    
    var store = new SessionStore(options);

    return store;

}

