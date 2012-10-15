
module.exports = function(app, model) {

    var actions = {};
    var sessionKey = app.config.session.key;
    
    actions.load = function(req, res, next) {
        req.cookies = null;
        app.cookieParser(req, {}, function (parseErr) {
            req.cookies  =  req.secureCookies || req.signedCookies || req.cookies;
            var sessionid = req.cookies[sessionKey];
            if(sessionid != null && sessionid != req.sessionID) {
                req.sessionID = sessionid;
                req.sessionStore.load(req.sessionID, function(err, session) {
                    req.session = session;
                    next(err || parseErr);
                });
            } else {
                next(parseErr);
            }
        });
    };

    return actions;
};
