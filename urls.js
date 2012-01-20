
exports.urls = [

["/",                                   "index.index",              "get"  ],
["/room/create",                        "chat.create",              "post" ],
["/r/:roomid",                          "chat.index",               "get"  ],
["/chat",                               "chat.socket",              "io"   ],

];

