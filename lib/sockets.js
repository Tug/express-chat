
exports.autoload = function(app, model) {

    var io = require('socket.io').listen(app.server);

    io.configure(function () {
        io.set('transports', ['flashsocket', 'xhr-polling']);
        io.set('log level', 2);
        //io.set('store', app.session.store);
    });

    configureSessions(app, io);

    return io;
    
};

exports.draw = function(io, routes, controllers) {
    for(var routename in routes) {
        var route = routes[routename];
        var appio = (route.url === '/') ? io : io.of(route.url);
        var route2 = {
            method: "on",
            url: "connection",
            // TODO: support chained actions
            actions: route.actions 
        };
        require("./routes").draw(appio, route2, controllers);
    }
};

/*
 * adapted from http://www.danielbaulig.de/socket-ioexpress/
 */
function configureSessions(app, io) {

    var key = app.session.key;
    var Session = app.express.session.Session;
    
    io.set('authorization', function (data, accept) {
        app.cookieParser(data, {}, function (parseErr) {
            if(parseErr) {
                accept("Could parse cookie from headers: "+data.headers+". "+(parseErr && parseErr.message), false);
                return;
            }
            data.cookies  =  data.secureCookies || data.signedCookies || data.cookies;
            data.sessionID = data.cookies[key];
            data.sessionStore = app.session.store;
            data.sessionStore.get(data.sessionID, function (storeErr, session) {
                if(storeErr) {
                    accept("Session does not exist. "+(storeErr && storeErr.message), false);
                    return;
                }
                if(!session || !session.cookie) {
                    accept("Session is empty. "+(storeErr && storeErr.message), false);
                    return;
                }
                data.session = new Session(data, session);
                accept(null, true);
            });
        });
    });
    
    io.sockets.on('connection', function (socket) {
        var hs = socket.handshake;
        console.log('A socket with sessionID ' + hs.sessionID + ' connected!');

        var intervalID = setInterval(function () {
            hs.session.reload(function () {
                hs.session.touch().save();
            });
        }, 30 * 1000);
        
        socket.on('disconnect', function () {
            clearInterval(intervalID);
        });
    });

}

