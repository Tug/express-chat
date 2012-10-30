
var fs = require('fs');

exports.autoload = function(app, config) {

    if(config.views.engine) {
        var viewEngine = config.views.engine;
        var renderer = null;
        if(viewEngine == "plates") {
            var Plates = require("plates");
            app.plates = Plates;
            renderer = function(str, options) { return Plates.bind(str, options.data, options.map); };
        } else if(viewEngine == "ejs") {
            renderer = require('ejs').render;
        } else {
            renderer = function(str, options) { return str };
        }
        app.viewEngine = createEngine(renderer);
        return app.viewEngine;
    }

    return null;
};

function createEngine(renderer) {
    
    var cache = {};
    
    return function(path, options, fn){
        var key = path + ':string';

        if ('function' == typeof options) {
            fn = options, options = {};
        }

        options.filename = path;

        try {
            var str = options.cache
              ? cache[key] || (cache[key] = fs.readFileSync(path, 'utf8'))
              : fs.readFileSync(path, 'utf8');
            fn(null, renderer(str, options));
        } catch (err) {
            fn(err);
        }
    };
};



