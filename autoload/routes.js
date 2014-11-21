
exports.readUrls = function(urls) {
    var routes = {};
    urls.forEach(function(line) {
        if(line == null || line.length < 2) {
            console.log("route line incomplete : ", line);
            return;
        }
        
        var url             = line[0];
        var handler         = line[1];
        var method          = (line.length > 2) ? line[2] : "get";
        var premiddlewares  = (line.length > 3) ? line[3] : null;
        var postmiddlewares = (line.length > 4) ? line[4] : null;
        
        var actions = [];
        actions.push(premiddlewares);
        actions.push(handler);
        actions.push(postmiddlewares);
        
        routes[handler] = {
            url     : url,
            method  : method,
            actions : actions,
        };
    });
    return routes;
};

exports.draw = function(app, route, controllers) {
    var actions = chainActions(route.actions, controllers);
    app[route.method].apply(app, [route.url, actions]);
};


var chainActions = exports.chainActions = function(actions, controllers) {
    if(actions == null) {
        return [];
    } else if(actions.constructor === Array) {
        var args = [];
        actions.forEach(function(action) {
            args = args.concat(chainActions(action, controllers));
        });
        if(args.length == 1) return args[0];
        else return args;
    } else if(typeof actions === "function") {
        return actions;
    } else {
        return getActionHandler(actions, controllers);
    }
}

var separator = ".";
function getActionHandler(handler, controllers) {
    
    if(typeof handler === 'function') return handler;
    if(typeof handler !== 'string') return null;
    
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


