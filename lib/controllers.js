var _ = require("underscore");
var routes = require("./routes");

exports.autoload = function(app, model, controllersPath, urls) {
    var fs = require("fs"),
        path = require("path"),
        files = fs.readdirSync(controllersPath),
        util = require("./util"),
        names = _.map(files,function(f){
            return path.basename(f).replace(/.js$/,'');
        });

    var controllersActions = {};
    
    _.each(names, function(controllerId) {
        var actions = require(path.join(controllersPath, controllerId))(app, model);
        controllersActions[controllerId] = actions;
    });
    
    var routeList = routes.draw(app, controllersActions, urls);
    
    app.url = function(handler, keys) {
        var url = routeList[handler];
        // copy hack from Connect router
        return url.replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, 
                         function(_, slash, format, key, capture, optional) {
            return slash + keys[key];
        });
    };

    return controllersActions;
    
};
