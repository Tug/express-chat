

exports.draw = function(expressApp, routes, controllers) {
    for(var routename in routes) {
        require("./routes").draw(expressApp, routes[routename], controllers);
    }
};


