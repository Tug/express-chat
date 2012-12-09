
var upm = require('upload-middleware');

module.exports = function(app) {

    var express = app.libs.express;
    
    return {
        urls : [
            ["/",                               "index.index",          "get"  ],
            ["/rooms/create",                   "index.createRoom",     "post" , express.bodyParser()],
            ["/r/:roomid",                      "chat.index",           "get"  ],
            ["/r/:roomid/upload",               "file.upload",          "post" , [upm.upload, "session.load"],
                                                                                 [upm.errorHandler] ],
            ["/r/:roomid/download/:fileid",     "file.download",        "get"  ],
        ]
        
      , ios : [
            ["/chat",                           "chat.socket",          "io"   ],
            ["/file",                           "file.socket",          "io"   ],
        ]
    };

}

