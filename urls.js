
module.exports = function(app) {

    var express = app.libs.express;
    
    return {
        urls : [
            ["/",                               "index.index",          "get"  ],
            ["/rooms/create",                   "index.createRoom",     "post" , express.bodyParser()],
            ["/r/:roomid",                      "chat.index",           "get"  ],
        ]
        
      , ios : [
            ["/chat",                           "chat.socket",          "io"   ],
        ]
    };

}

