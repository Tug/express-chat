
module.exports = function(app) {
    
    return {
        //  [route,                             controller,             method,     pre-middleware(s),     post-middleware(s)  ]
        // WARNING : Controller name must be unique !
        // Otherwise it won't be possible to find the corresponding route with the app.routes.url() method from `autoload`
        urls : [
            ["/",                               "index.index",          "get"  ],
            ["/rooms/create",                   "index.createRoom",     "post" ],
            ["/r/:roomid",                      "chat.index",           "get"  ],
        ],
        
        //  [namespace,                 controller,              method/event    middleware]
        ios : [
            ["/chat",                           "chat.socket",          "connection", ["chat.authorizeSocket"] ],
        ]
    };

}

