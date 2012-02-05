
exports.autoload = function(app, model) {

    var io = require('socket.io').listen(app);
    
    io.configure(function () {
        io.set('transports', ['websocket', 'flashsocket', 'xhr-polling']);
        io.set('log level', 2);
        //io.set('store', app.sessionStore)
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
            actions: route.actions // chained action not supported yet
        };
        require("./routes").draw(appio, route2, controllers);
    }
};

/*
 * http://www.danielbaulig.de/socket-ioexpress/
 */
function configureSessions(app, io) {
    
    var parseCookie = require('connect').utils.parseCookie;
    var Session = app.express.session.Session;
    
    io.set('authorization', function (data, accept) {
        if (data.headers.cookie) {
            data.cookie = parseCookie(data.headers.cookie);
            data.sessionID = data.cookie['express.sid'];
            // save the session store to the data object 
            // (as required by the Session constructor)
            data.sessionStore = app.sessionStore;
            app.sessionStore.get(data.sessionID, function(err, session) {
                if (err || !session) {
                    accept('Error', false);
                } else {
                    // create a session object, passing data as request and our
                    // just acquired session data
                    data.session = new Session(data, session);
                    accept(null, true);
                }
            });
        } else {
           return accept('No cookie transmitted.', false);
        }
    });
    
    io.sockets.on('connection', function (socket) {
        var hs = socket.handshake;
        //socket.join(hs.sessionID);
        console.log('A socket with sessionID ' + hs.sessionID + ' connected!');
        // setup an inteval that will keep our session fresh
        var intervalID = setInterval(function () {
            // reload the session (just in case something changed,
            // we don't want to override anything, but the age)
            // reloading will also ensure we keep an up2date copy
            // of the session with our connection.
            hs.session.reload( function () { 
                // "touch" it (resetting maxAge and lastAccess)
                // and save it back again.
                hs.session.touch().save();
            });
        }, 60 * 1000);
        socket.on('disconnect', function () {
            //console.log('A socket with sessionID ' + hs.sessionID + ' disconnected!');
            // clear the socket interval to stop refreshing the session
            clearInterval(intervalID);
        });

    });
    
}
