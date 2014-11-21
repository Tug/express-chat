
var path = require('path');
var http = require('http');
var express = require('express');

module.exports = function(app, model, appsConfig) {

    var apps = [];

    for(var appName in appsConfig) {
        var appConfig = appsConfig[appName];
        var clientApp = {};
        clientApp.name          = appName;
        clientApp.config        = appConfig;
        clientApp.express       = express();
        clientApp.server        = http.createServer(clientApp.express);
        configureApp(clientApp, app.config);
        if(!app.controllers.apps || !app.controllers.apps[appName]) {
            throw new Error('Controller not found for app '+appName);
        }
        clientApp.express.use(app.controllers.apps[appName]);
        apps.push(clientApp);
    }

    // configure app that can only display a view
    function configureApp(app, config) {
        app.express.configure(function() {
            if(config.engines) {
                for(var key in config.engines) {
                    app.express.engine(key, config.engines[key]);
                }
            }
            if(config.paths.views) {
                app.express.set('views', config.paths.views);
            }
            if(config.settings) {
                for(var key in config.settings) {
                    app.express.set(key, config.settings[key]);
                }
            }
            app.config.assets = config.assets;
            app.middleware = function(middleware, options) {
                switch(typeof middleware) {
                    case "string":
                        switch(middleware) {
                            case "static":
                                for(var route in (config.paths.statics || {})) {
                                    var staticPath = config.paths.statics[route];
                                    // if path is not absolute, make it so
                                    if(path.resolve(staticPath) !== staticPath) {
                                        staticPath = path.join(config.application_root, staticPath);
                                    }
                                    app.express.use(route, express.static(staticPath));
                                }
                                break;
                            default:
                                app.express.use(express[middleware](options || config[middleware]));
                        }
                        break;
                    default:
                        app.express.use(middleware);
                }
            };
            app.middleware('static');
            require(path.join(config.paths.conf, "assets"))(app, model, function() {});
        });
    }

    return apps;
};
