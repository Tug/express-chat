var path = require("path");

module.exports.createApplication = function(config, callback) {
  
    var express = require('express');
    var expressApp = express();
    
    var app = {
      "expressApp"  : expressApp,
      "express"     : express,
      "server"      : require('http').createServer(expressApp)
    };

    console.log("Starting application...");
    
    
    if(config.session.engine) {
        var sessionEngine = config.session.engine;
        var SessionStore = null;
        var options = null;
        if(sessionEngine == "mongo") {
            SessionStore = require('connect-mongo');
            options = config.database.mongo;
        } else if(sessionEngine == "redis") {
            SessionStore = require('connect-redis')(express);
            options = config.database.redis;
        } else {
            SessionStore = express.session.MemoryStore;
        }
        config.session.store = new SessionStore(options);
        app.config = config;
    }

    app.cookieParser = app.express.cookieParser(config.session.secret);
    
    expressApp.configure(function() {
        expressApp.use('/static', express.static(config.paths.static_root));
        expressApp.use('/static/lib', express.static(config.paths.public_lib));
        expressApp.use(express.favicon(config.paths.favicon, { maxAge: 2592000000 }));
        //expressApp.use(express.bodyParser()); // parse POST
        //expressApp.use(express.methodOverride()); // use custom HTTP methods: DEL, PUT ...
        expressApp.use(express.cookieParser(config.session.secret));
        expressApp.use(express.session(config.session));
        expressApp.use(expressApp.router);
        expressApp.use(express.errorHandler());
        expressApp.set('views', config.paths.views);
        expressApp.set('view engine', config.views.type || "html");
        //expressApp[config.views.cache || "enable"]('view cache');
        expressApp.engine('.'+(config.views.type || "html"), require("./views.js").autoload(app, config));
        
    });   

    /*
    expressApp.configure('development', function(){
        expressApp.use(express.logger({ format: ':method :url :status' }));
        expressApp.use(express.errorHandler({ dumpExceptions: true, showStack: true, formatUrl: 'txmt' }));

    });
    
    expressApp.configure('production', function(){
        expressApp.use(express.errorHandler());
    });
    */
    
    var model = {};

    if(config.database.mongo) {
        var mongoose = require('mongoose');
        model.mongoose = mongoose;
        mongoose.connect(config.database.mongo.uri);
        var connection = mongoose.connections[0];
        var dbName = connection.name;
        var dbHost = connection.host;
        var dbPort = parseInt(connection.port, 10);
        connection.on("open", function() {
            console.log("Connected to MongoDB on "+dbHost+":"+dbPort+"/"+dbName);
        });
        
        // second connection for gridfs
        var mongodb = require('mongodb');
        model.mongodb = new mongodb.Db(dbName, new mongodb.Server(dbHost, dbPort, {}), {safe: false});
        model.mongodb.open(function(err, db) {
            console.log(err || "Connected to MongoDB/GridFS");
        });
    }
    
    if(config.database.redis) {
        var redis = require('redis');
        model.redis = {
            createClient: function() {
                var client = redis.createClient(config.database.redis.port, config.database.redis.host);
                if(options.password) client.auth(config.database.redis.password);
                return client;
            }
        };
    }

    function UrlFromController(routes) {
        return function(handler, keys) {
            var url = routes[handler].url;
            // hack copied from Connect router
            // TODO: support complex routes
            return url.replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, 
                             function(_, slash, format, key, capture, optional) {
                return slash + keys[key];
            });
        };
    };
    
    var routes = {
        urls  : require("./routes.js").readUrls(config.urls),
        ios   : require("./routes.js").readUrls(config.ios)
    };
    
    // functions that returns a url from the handler name
    app.routes = {
        url  : UrlFromController(routes.urls),
        io   : UrlFromController(routes.ios)
    }
    
    app.libs        = require("./libs.js"       ).autoload(config.paths.libs);
    app.models      = require("./models.js"     ).autoload(app, model, config.paths.models);
    app.controllers = require("./controllers.js").autoload(app, model, config.paths.controllers);
    app.crons       = require("./crons.js"      ).autoload(app, model, config.paths.crons);
    app.io          = require("./sockets.js"    ).autoload(app, model, config);

    require("./controllers.js").draw(expressApp, routes.urls, app.controllers);
    require("./sockets.js"    ).draw(app.io, routes.ios, app.controllers);
    
    
    callback(null, app);
    
    return app;

};

