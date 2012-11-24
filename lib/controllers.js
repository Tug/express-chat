
exports.autoload = function(app, model, controllersPath) {
    var fs = require("fs"),
        path = require("path"),
        files = [];
    
    try {
      files = fs.readdirSync(controllersPath);
    } catch(err) {}

    var names = files.map(function(f) {
        return path.basename(f).replace(/.js$/,'');
    });
    
    var controllers = {};
    names.forEach(function(controllerId) {
        var actions = require(path.join(controllersPath, controllerId))(app, model);
        controllers[controllerId] = actions;
    });
    
    return controllers;
};

exports.draw = function(expressApp, routes, controllers) {
    for(var routename in routes) {
        require("./routes").draw(expressApp, routes[routename], controllers);
    }
};


