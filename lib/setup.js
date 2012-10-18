
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
        var engine = config.session.engine;
        var Store = null;
        var options = null;
        if(engine == "mongodb") {
            Store = require('connect-mongo');
            options = config.database.mongodb;
        } else if(engine == "redis") {
            Store = require('connect-redis')(express);
            options = config.database.redis;
        } else {
            Store = express.session.MemoryStore;
        }
        config.session.store = new Store(options);
        app.config = config;
    }
    
    var htmlEngine = {
        compile: function(str, options){
            return function(locals){
                return str;
            };
        }
    };

    app.cookieParser = app.express.cookieParser(config.session.secret);
    
    expressApp.configure(function() {
        expressApp.use(express.favicon(config.paths.favicon, { maxAge: 2592000000 }));
        //expressApp.use(express.bodyParser()); // parse POST
        //expressApp.use(express.methodOverride()); // use custom HTTP methods: DEL, PUT ...
        expressApp.use(app.cookieParser);
        expressApp.use(express.session(config.session));
        expressApp.use(expressApp.router);
        expressApp.use(express.static(config.paths.public_root));
        expressApp.use(express.logger({ format: ':method :url :status' }));
        expressApp.use(express.errorHandler({ dumpExceptions: true, showStack: true, formatUrl: 'txmt' }));
        expressApp.set('views', config.paths.views);
        expressApp.set('view engine', config.views.type || "html");
        expressApp[config.views.cache || "enable"]('view cache');
        expressApp.engine('.'+(config.views.type || html), config.views.engine || htmlEngine);
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

    if(config.database.mongodb) {
        var mongoose = require('mongoose');
        model.mongoose = mongoose;
        mongoose.connect(config.database.mongodb.uri);
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
        var options = config.database.redis;
        model.redis = {
            createClient: function() {
                var client = redis.createClient(options.port, options.host);
                if(options.password) client.auth(options.password);
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
    app.io          = require("./sockets.js"    ).autoload(app, model);

    require("./controllers.js").draw(expressApp, routes.urls, app.controllers);
    require("./sockets.js"    ).draw(app.io, routes.ios, app.controllers);
    
    
    callback(null, app);
    
    return app;

};

