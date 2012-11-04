
var upload_middleware = require('upload-middleware');
var express = require('express');

exports.urls = [
["/",                                   "index.index",              "get"  ],
["/rooms/create",                       "index.createRoom",         "post" , express.bodyParser()],
["/r/:roomid",                          "chat.index",               "get"  ],
["/r/:roomid/upload",                   "file.upload",              "post" , [upload_middleware.upload, "session.load"],
                                                                             [upload_middleware.errorHandler] ],
["/r/:roomid/download/:fileid",         "file.download",            "get"  ],
];

exports.ios = [
["/chat",                               "chat.socket",              "io"   ],
["/file",                               "file.socket",              "io"   ],
];

