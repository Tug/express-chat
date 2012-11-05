var path = require('path');

global.application_root = __dirname;

var theme = "board";

var config = {
    hostname  : "localhost"
  , port      : 3000
  , database  : {
        mongo : {
            uri: "mongodb://localhost:27017/db"
        }
      , redis : {
            host: "localhost"
          , port: 6379
        }
    }
  , views : {
        type    : "html"
      , engine  : "plates"
      , cache   : "enable"
      , theme   : theme
    }
  , paths : {
          root        : application_root
        , app         : path.join(application_root, "app")
        , public_root : path.join(application_root, "public")
        , public_lib  : path.join(application_root, "public", "lib")
        , static_root : path.join(application_root, "public", theme)
        , models      : path.join(application_root, "app", "models")
        , views       : path.join(application_root, "app", "views", theme)
        , libs        : path.join(application_root, "app", "libs")
        , controllers : path.join(application_root, "app", "controllers")
        , crons       : path.join(application_root, "app", "crons")
        , favicon     : path.join(application_root, "public", "favicon.ico")
    }
  , urls: require("./urls").urls
  , ios : require("./urls").ios
  , session : {
        secret  : "rgkervdgmigeccxvfezf"
      , key     : "express.sid"
      , cookie  : {
            maxAge    : 24 * 3600 * 1000
          , path      : "/"
          , httpOnly  : false
        }
      , reapInterval  : 15 * 60 * 1000
      , engine  : "redis"
    }
  , socketio : {
        store   : "mongo"
      , enable  : [
            "browser client minification"
          , "browser client etag"
        ]
      , set     : {
            'log level'   : 2
          , 'transports'  : [
                'websocket'
              , 'flashsocket'
              , 'htmlfile'
              , 'xhr-polling'
              , 'jsonp-polling'
            ]
          //, 'browser client gzip' // opened issue : https://github.com/LearnBoost/socket.io/issues/932
        }
    }
  , limits : {
        maxMessageLength  : 3000
      , maxUsernameLength : 50
      , maxSimulUp        : 1
      , maxUpMB           : 1000
      , maxDownMB         : 10000
      , speedTargetKBs    : 1500
      , reloadTimeMin     : 6 * 60
    }
};

module.exports = function(userconfig) {
    if(userconfig)
        config = require("./lib/util").mergeRecursive(config, userconfig);
    return config;
}

