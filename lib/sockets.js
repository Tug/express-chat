
var debugio = require('debug')('socket-io');

exports.autoload = function(app, model, config) {

    var io = require('socket.io').listen(app.server);

    io.configure(function () {
        (config.socketio.enable || []).forEach(function(prop) { io.enable(prop); });
        config.socketio.set = config.socketio.set || {};
        switch(config.socketio.store) {
        case "redis":
            var RedisStore = require('socket.io/lib/stores/redis');
            config.socketio.set.store = new RedisStore({
                redisPub    : model.redis.createClient()
              , redisSub    : model.redis.createClient()
              , redisClient : model.redis.createClient()
            });
            break;
        case "mongo":
            var MongoStore = require('socket.io-mongo');
            // TODO: write own version of MongoStore which reuse mondel.mongo
            var connStr = "mongodb://";
            if(config.database.mongo.options.user && config.database.mongo.options.pass)
                connStr += config.database.mongo.options.user+":"+config.database.mongo.options.pass+"@";
            connStr += config.database.mongo.servers[0];
            config.socketio.set.store = new MongoStore({url: connStr});
            break;
        }
        for (var key in (config.socketio.set || [])) { io.set(key, config.socketio.set[key]); }
        configureSessions(app, io);
    });

    return io;
    
};

exports.draw = function(io, routes, controllers) {
    for(var routename in routes) {
        var route = routes[routename];
        var appio = (route.url === '/') ? io : io.of(route.url);
        var route2 = {
            method: "on",
            url: "connection",
            // TODO?: support chained actions
            actions: route.actions
        };
        require("./routes").draw(appio, route2, controllers);
    }
};

/*
 * adapted from http://www.danielbaulig.de/socket-ioexpress/
 */
function configureSessions(app, io) {

    var key = app.config.session.key;
    
    io.set('authorization', function (data, accept) {
        app.cookieParser(data, {}, function (parseErr) {
            if(parseErr) {
                accept("Could not parse cookie from headers. "+(parseErr && parseErr.message), false);
                return;
            }
            data.cookies = data.secureCookies || data.signedCookies || data.cookies;
            data.sessionID = data.cookies[key];
            app.sessionStore.load(data.sessionID, function(storeErr, sess) {
                if(storeErr || !sess) {
                    accept("Session does not exist. "+(storeErr && storeErr.message), false);
                    return;
                }
                data.session = sess;
                accept(null, true);
            });
        });
    });
    
    io.sockets.on('connection', function (socket) {
        var hs = socket.handshake;
        debugio('A socket with sessionID ' + hs.sessionID + ' connected!');
    });

}

