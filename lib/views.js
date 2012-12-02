
var fs = require('fs');

exports.autoload = function(viewsConfig) {
    
    var renderer = null;
    
    switch(viewsConfig.engine) {
    case "plates":
        var Plates = require("plates");
        renderer = function(str, options) { return Plates.bind(str, options.data, options.map); };
        break;
    case "ejs":
        renderer = require('ejs').render;
        break;
    default:
        renderer = function(str, options) { return str };
    }
    
    return createEngine(renderer);
    
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



