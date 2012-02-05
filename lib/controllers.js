var _ = require("underscore");

exports.autoload = function(app, model, controllersPath) {
    var fs = require("fs"),
        path = require("path"),
        files = [];
    
    try {
      files = fs.readdirSync(controllersPath);
    } catch(err) {}

    var names = _.map(files,function(f) {
        return path.basename(f).replace(/.js$/,'');
    });
    
    var controllers = {};
    _.each(names, function(controllerId) {
        var actions = require(path.join(controllersPath, controllerId))(app, model);
        controllers[controllerId] = actions;
    });
    
    return controllers;
};

exports.draw = function(app, routes, controllers) {
    for(var routename in routes) {
        require("./routes").draw(app, routes[routename], controllers);
    }
};


