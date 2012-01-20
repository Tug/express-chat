
var link = function(app, controllers, url, handler, method, premiddlewares, postmiddlewares){
    
    var method = method || "get";
    
    var actionHandler = getActionHandler(controllers, handler);
    if(actionHandler == null) return false;
    if(url == null) return false;

    var args = [url];
    
    if(premiddlewares) {
        if(premiddlewares.constructor !== Array)
            premiddlewares = [premiddlewares];
        if(premiddlewares.length > 0) {
            premiddlewares.forEach(function(premiddleware) {
                var actionHandlerMid = getActionHandler(controllers, premiddleware);
                if(actionHandlerMid != null) {
                    args.push(actionHandlerMid);
                }
            });
        }
    }

    args.push(actionHandler);

    if(postmiddlewares) {
        if(postmiddlewares.constructor !== Array)
            postmiddlewares = [postmiddlewares];
        if(postmiddlewares.length > 0) {
            postmiddlewares.forEach(function(postmiddleware) {
                var actionHandlerMid = getActionHandler(controllers, postmiddleware);
                if(actionHandlerMid != null) {
                    args.push(actionHandlerMid);
                }
            });
            args.push(function() { });
        }
    }

    if(method == "io") {
        app.io.of(url).on("connection", actionHandler);
    } else {
        app[method].apply(app, args);
    }
    
    return true;
};

var separator = ".";

var getActionHandler = function(controllers, handler) {
    
    var parts = handler.split(separator),
        action = parts.pop(),
        controllerId = parts.join(separator);

    if(controllerId == null || action == null) {
        console.log("handler syntax error : ", handler);
        return null;
    }
    
    var controller = controllers[controllerId];

    if(controller == null) {
        console.log("No controller found for controller : "+controllerId);
        return null;
    }

    var actionHandler = controller[action];

    if(actionHandler == null) {
        console.log("No function matching "+action+" found in controller "+controllerId);
        return null;
    }

    return actionHandler;
}


module.exports.draw = function(app, controllers, urls) {
    var routes = {};
    urls.forEach(function(line) {

        if(line == null || line.length < 2) {
            console.log("route line incomplete : ",line);
            return;
        }

        var url = line[0];
        var handler = line[1];

        if(url == null || handler == null) {
            console.log("route line syntax error : ", line);
            return;
        }

        var method = null;
        var premiddlewares = null;
        var postmiddlewares = null;
        
        if(line.length > 2)
            method = line[2];

        if(line.length > 3)
            premiddlewares = line[3];

        if(line.length > 4)
            postmiddlewares = line[4];

        if(link(app, controllers, url, handler, method, premiddlewares, postmiddlewares)) {
            routes[handler] = url;
        }

    });
    return routes;
};
