
var path      = require('path')
  , express   = require('express')
  , http      = require('http')
  , debug     = require('debug')('autoload')
  , Step      = require('step')
  , autoload  = require('./autoload');

module.exports.createApplication = function(app, model, config, callback) {
    
    Step(

        function loadLibraries() {
            
            debug('Loading system libraries...');
            app.libs          = app.libs || {};
            app.libs.express  = express;
            app.libs.Step     = Step;
            app.libs.step     = Step;
            app.libs.connect  = require('connect');
            app.libs.mongodb  = require('mongodb');
            app.libs.mongoose = require('mongoose');
            app.libs.redis    = require('redis');
            app.libs['socket.io'] = require('socket.io');

            debug('Loading project libraries...');
            require('./libs.js').autoload(app.libs, config.paths.libs);

            this();
        },

        function createModel(err) {
            var next = this;
            if(err) return next(err);
            
            debug('Creating models...');
            
            var group = this.group();
            for(var dbName in config.database) {
                require('./models/'+dbName).autoload(app, model, config.database[dbName], group());
            }
        },

        function createApplication(err) {
            var next = this;
            if(err) return next(err);
            
            debug('Creating application...');
            
            app.config        = config;
            app.express       = express();
            app.server        = http.createServer(app.express);

            app.sessionStore  = require('./session.js').autoload(model, config.session);
            config.session.store = app.sessionStore;
            // convention so we don't need to set the secret key twice in the config
            config.cookieParser = config.session.secret;

            next();
        },

        function loadModels(err) {
            var next = this;
            if(err) return next(err);
            
            debug('Loading models...');
            app.models      = autoload(app, model, config.paths.models);

            next();
        },

        function readRoutes(err) {
            var next = this;
            if(err) return next(err);
            
            debug('Reading routes...');
            var routeConfig = require(config.paths.routes)(app);
            config.urls = routeConfig.urls;
            config.ios = routeConfig.ios;

            app.routes = {
                urls  : require('./routes.js').readUrls(config.urls)
              , ios   : require('./routes.js').readUrls(config.ios)
            };
            
            app.routes.url = require('./util.js').urlFromController(app.routes.urls);
            app.routes.io = require('./util.js').urlFromController(app.routes.ios);

            next();
        },

        function loadJobs(err) {
            var next = this;
            if(err) return next(err);

            debug('Loading jobs...');
            app.jobs = autoload(app, model, config.paths.jobs);

            next();
        },
        
        function configureApplication(err) {
            var next = this;
            if(err) return next(err);

            if(config.socketio) {
                debug('Loading socket-io...');
                app.io = require('./sockets.js').autoload(app, model, config);
            }

            // we don't use the path here (default path is "/" in express)
            // because the convention with express-autoload is to centralize routing definitions in a file
            // TODO: add a mean to configure namespace middlewares (thus removing special case for `static`)
            app.middleware = function(middleware, options, useIt) {
                if(typeof options === 'boolean') {
                    useIt = options;
                    options = undefined;
                }
                useIt = (useIt != undefined) ? useIt : true;
                var middlewareFunc;
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
                                return;
                            default:
                                middlewareFunc = express[middleware](options || config[middleware]);
                        }
                        break;
                    default:
                        middlewareFunc = middleware;
                }
                if(middlewareFunc && useIt) app.express.use(middlewareFunc);
                return middlewareFunc;
            };

            debug('Configuring application...');

            // general configuration
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
                (config.middlewares || []).forEach(function(middleware) {
                    app.middleware(middleware);
                });
            });

            // custom configuration
            if(config.paths.conf) {
                require(config.paths.conf).preRouting(app, model, next);
            } else {
                next();
            }

        },

        function loadControllers(err) {
            var next = this;
            if(err) return next(err);

            app.middleware(app.express.router);
            
            debug('Loading controllers...');
            app.controllers = autoload(app, model, config.paths.controllers);
            
            debug('Mapping controllers...');
            require('./controllers.js').draw(app.express, app.routes.urls, app.controllers);

            debug('Mapping sockets...');
            require('./sockets.js').draw(app.io, app.routes.ios, app.controllers);

            next();
        },

        function loadApps(err) {
            var next = this;
            if(err) return next(err);

            debug('Loading client apps...');
            app.apps = require('./apps.js')(app, model, config.apps);

            next();
        },

        function postRoutingConfiguration(err) {
            var next = this;
            if(err) return next(err);

            // custom configuration
            if(config.paths.conf) {
                require(config.paths.conf).postRouting(app, model, next);
            } else {
                next();
            }
        },

        function end(err) {
            callback(err);
        }
    
    );

};

