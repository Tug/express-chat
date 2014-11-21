
module.exports = function(app, model, callback) {

    var io = app.io;

	var key = app.config.session.key;

    io.use(function(socket, next) {
	    var req = socket.request;
		app.cookieParser(req, {}, function (parseErr) {
            if(parseErr) {
                next("Could not parse cookie from headers. "+(parseErr && parseErr.message), false);
                return;
            }
            req.cookies = req.secureCookies || req.signedCookies || req.cookies;
            req.sessionID = req.cookies[key];
            app.sessionStore.load(req.sessionID, function(storeErr, sess) {
                if(storeErr || !sess) {
                    next("Session does not exist. "+(storeErr && storeErr.message), false);
                    return;
                }
                req.session = sess;
                next(null, true);
            });
        });
    });

    callback();

};