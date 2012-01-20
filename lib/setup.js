
module.exports.createApplication = function(config, callback) {
  
    var express = require('express');
    var app = express.createServer();
    var form = require('connect-form');

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
        }
        config.session.store = new Store(options);
    }
    
    var htmlEngine = {
        compile: function(str, options){
            return function(locals){
                return str;
            };
        }
    };
    
    app.configure(function() {
        app.use(express.favicon(config.paths.favicon, { maxAge: 2592000000 }));
        app.use(express.bodyParser()); // parse JSON
        app.use(express.methodOverride());
        app.use(express.cookieParser());
        app.use(form({keepExtensions: true}));
        app.use(express.session(config.session));
        app.use(app.router);
        app.use(express.static(config.paths.public_root));
        app.use(express.logger({ format: ':method :url :status' }));
        app.use(express.errorHandler({ dumpExceptions: true, showStack: true, formatUrl: 'txmt' }));
        app.set('views', config.paths.views);
        
        app.set("view options", config.views.options || {layout: false});
        app.set('view engine', config.views.type || "html");
        app[config.views.cache || "enable"]('view cache');
        app.register('.'+(config.views.type || html), config.views.engine || htmlEngine);
    });   

    /*
    app.configure('development', function(){
        app.use(express.logger({ format: ':method :url :status' }));
        app.use(express.errorHandler({ dumpExceptions: true, showStack: true, formatUrl: 'txmt' }));

    });
    
    app.configure('production', function(){
        app.use(express.errorHandler());
    });
    */
    
    var model = {};

    if(config.database.mongodb) {
        var mongoose = require('mongoose');
        model.mongoose = mongoose;
        var options = config.database.mongodb;
        var url = "mongodb://"+options.host+":"+options.port+"/"+options.db;
        mongoose.connect(url, options);
        mongoose.connection.on("open", function() {
            console.log("connected to MongoDB");
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

    app.io = require('socket.io').listen(app);
    app.io.configure(function () {
        app.io.set('transports', ['websocket', 'flashsocket', 'xhr-polling']);
        app.io.set('log level', 2);
    });
    
    app.libs = require("./libs.js").autoload(config.paths.libs);
    
    app.models = require("./models.js").autoload(app, model, config.paths.models);
    app.controllers = require("./controllers.js").autoload(app, model, config.paths.controllers, config.urls);
    app.crons = require("./crons.js").autoload(app, model, config.paths.crons);
    
    
    callback(null, app);
    
    return app;

};

