
var mongodb         = require('mongodb')
  , mongoose        = require('mongoose')
  , Db              = mongodb.Db
  , Server          = mongodb.Server
  , ReplSetServers  = mongodb.ReplSetServers
  , debug   = require('debug')('express-chat');

exports.autoload = function(mongoConfig, callback) {
    
    var replset, server;
    
    if(mongoConfig.replset) {
        replset = connectReplicaSet(mongoConfig.replset);
    } else {
        server = createServer(mongoConfig.server);
    }

    if(mongoConfig.options.safe && mongoConfig.options.safe.w == 'all' ) {
        mongoConfig.options.safe.w = (replset) ? replset.servers.length : 1;
    }
    
    var client = new Db( mongoConfig.db
                       , replset || server
                       , mongoConfig.options );
    client.open(function(err, db) {
        if(err) {
            console.log(err);
            return;
        }
        debug(err || "Connected to MongoDB");
        mongoose.connection.readyState = 'connected';
        mongoose.connection.onOpen();
        if(mongoConfig.user && mongoConfig.password) {
            db.authenticate( mongoConfig.user
                           , mongoConfig.password
                           , function() {
                debug(err || "Authenticated to MongoDB");
                callback && callback(null, client);
            });
        } else {
            callback && callback(null, client);
        }
    });
    
    mongoose.connection.db = client;
    mongoose.connection.readyState = 'connecting';

    return client;
}

function createServer(serverInfo) {
    return new Server(serverInfo.host, serverInfo.port, serverInfo.options);
}

function connectReplicaSet(replsetConfig) {
    return new ReplSetServers(replsetConfig.servers.map(createServer), replsetConfig.options);
}

