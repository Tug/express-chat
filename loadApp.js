var fs          = require('fs');
var debug       = require('debug')('express-chat');

module.exports = function(userconfig, callback, bindPort) {

    callback = callback || function nocallback() {};
    bindPort = bindPort !== false;
    var model   = {};
    var app     = {};
    var config  = require('./config')(userconfig);

    // we need to set NODE_ENV before calling require('express')
    // so before require('express-autoload')
    if(config.settings.env) process.env.NODE_ENV = config.settings.env;

    debug('Starting application...');
    debug('Configuration is :\n', config);

    require('./autoload')(app, model, config, function(err) {
        if(err) return callback(err);

        app.libs.Step(function() {
            var next = this;
            if(bindPort) {
                app.server.listen(config.port, config.hostname, next);
                app.server.once("error", function(err) {
                    console.error("error", err);
                    next(err);
                });
            } else {
                next();
            }
        }, function(err) {
            var closeApp = function() {
                if(app.server._handle) app.server.close();
                app.apps.forEach(function(clientApp) {
                    if(clientApp.server._handle) clientApp.server.close();
                });
            };
            callback(err, app, model, config, closeApp);
        });

    });

};
