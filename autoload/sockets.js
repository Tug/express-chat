
var chainActions = require("./routes").chainActions;

exports.autoload = function(app, model, config) {
    var io = require('socket.io')(app.server, config.socketio.options);
    switch(config.socketio.adapter) {
        case "redis":
            io.adapter(require('socket.io-redis')(config.database.redis));
            break;
    }
    return io;
};


exports.draw = function(io, routes, controllers) {
    // DOES NOT support post controllers
    for(var routename in routes) {
        (function(route) {
            var appio = (route.url === '/') ? io : io.of(route.url);
            var actions = chainActions(route.actions, controllers);
            var main = actions.pop();
            actions.forEach(function(action) {
                appio.use(action);
            });
            appio.on(route.method, main);
        })(routes[routename]);
    }
};

