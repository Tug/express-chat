
var path    = require('path')
  , express = require('express')
  , http    = require('http')
  , debug   = require('debug')('express-chat')
  , Step    = require('step');

module.exports.createApplication = function(config, callback) {

    var model = {}
      , app = {};
    
    Step(

        function createModel() {
            
            debug('Creating model...');
            
            var group = this.group();
            if(config.database.mongo) {
                require('./mongo.js').autoload(model, config.database.mongo, group());
            }
            if(config.database.mongo) {
                require('./redis.js').autoload(model, config.database.redis, group());
            }
        },

        function createApplication() {
            
            debug('Creating application...');
            
            var expressApp    = express();
            
            app.config        = config;
            app.express       = expressApp;
            app.server        = http.createServer(expressApp);
            app.cookieParser  = express.cookieParser(config.session.secret);
            app.sessionStore  = require('./session.js').autoload(model, config.session);
            app.viewEngine    = require('./views.js').autoload(config.views);

            this(null, expressApp);
        },

        function configureApplication(err, expressApp) {
            
            debug('Configuring application...');
            
            config.session.store = app.sessionStore;
            
            expressApp.configure(function() {
                expressApp.use('/static'     , express.static(config.paths.static_root));
                expressApp.use('/static/lib' , express.static(config.paths.public_lib));
                expressApp.use(express.favicon(config.paths.favicon, { maxAge: 2592000000 }));
                expressApp.use(app.cookieParser);
                expressApp.use(express.session(config.session));
                expressApp.use(expressApp.router);
                expressApp.use(express.errorHandler());
                expressApp.set('views', config.paths.views);
                expressApp.set('view engine', config.views.type || 'html');
                expressApp.engine('.'+(config.views.type || 'html'), app.viewEngine);
            });
            
            this();
        },

        function readRoutes() {
            
            debug('Reading routes...');
            
            var routes = {
                urls  : require('./routes.js').readUrls(config.urls)
              , ios   : require('./routes.js').readUrls(config.ios)
            };
            
            app.routes = {
                url   : require('./util.js').urlFromController(routes.urls)
              , io    : require('./util.js').urlFromController(routes.ios)
            };
            
            this(null, routes);
        },

        function loadMVC(err, routes) {
        
            debug('Loading MVC elements...');
            
            debug('Loading libs...');
            app.libs        = require('./libs.js'       ).autoload(config.paths.libs);
            debug('Loading models...');
            app.models      = require('./models.js'     ).autoload(app, model, config.paths.models);
            debug('Loading controllers...');
            app.controllers = require('./controllers.js').autoload(app, model, config.paths.controllers);
            debug('Loading crons...');
            app.crons       = require('./crons.js'      ).autoload(app, model, config.paths.crons);
            debug('Loading socket-io...');
            app.io          = require('./sockets.js'    ).autoload(app, model, config);
            
            debug('Mapping controllers...');
            require('./controllers.js').draw(app.express, routes.urls, app.controllers);

            debug('Mapping sockets...');
            require('./sockets.js'    ).draw(app.io, routes.ios, app.controllers);
        
            this();
        },

        function end(err) {
            callback(err, app, model);
        }
    
    );
    
    return app;

};

