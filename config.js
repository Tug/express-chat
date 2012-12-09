
var path = require('path');

global.application_root = __dirname;

var theme = 'board';

var config = {
    hostname  : 'localhost'
  , port      : 3000
  , database  : {
        mongo : {
            servers : [
                'localhost:27017/db'
            ]
          , options : {
                server : {
                    auto_reconnect: true
                }
              , db : {
                    safe          : true
                }
            }
        }
      , redis : {
            host: 'localhost'
          , port: 6379
        }
    }
  , views : {
        type    : 'html'
      , engine  : 'plates'
      , cache   : 'enable'
      , theme   : theme
    }
  , paths : {
          root        : application_root
        , routes      : path.join(application_root, 'urls.js')
        , app         : path.join(application_root, 'app')
        , public_root : path.join(application_root, 'public')
        , public_lib  : path.join(application_root, 'public', 'lib')
        , static_root : path.join(application_root, 'public', theme)
        , models      : path.join(application_root, 'app', 'models')
        , views       : path.join(application_root, 'app', 'views', theme)
        , libs        : path.join(application_root, 'app', 'libs')
        , controllers : path.join(application_root, 'app', 'controllers')
        , crons       : path.join(application_root, 'app', 'crons')
        , favicon     : path.join(application_root, 'public', theme, 'favicon.ico')
    }
  , session : {
        secret  : 'rgkervdgmigeccxvfezf'
      , key     : 'express.sid'
      , cookie  : {
            maxAge    : 24 * 3600 * 1000
          , path      : '/'
          , httpOnly  : false
        }
      , reapInterval  : 15 * 60 * 1000
      , engine  : 'mongo'
    }
  , socketio : {
        store   : 'redis'
      , enable  : [
            'browser client minification'
          , 'browser client etag'
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
      , minMessageInterval: 3000 //ms
      , maxTotalUp        : 200  // files
      , maxTotalDown      : 2000 // files
      , maxSimulUp        : 1
      , maxSimulDown      : 3
      , maxUpMB           : 1000
      , maxDownMB         : 10000
      , uploadSpeedKBs    : 500
      , downloadSpeedKBs  : 500
      , reloadTimeMin     : 6 * 60
    }
};

module.exports = function(userconfig) {
    return (userconfig) ? mergeRecursive(config, userconfig) : config;
}

function mergeRecursive(obj1, obj2) {
    for(var p in obj2) {
        try {
            // Property in destination object set; update its value.
            if(obj2[p].constructor==Object) {
                obj1[p] = mergeRecursive(obj1[p], obj2[p]);
            } else {
                obj1[p] = obj2[p];
            }
        } catch(e) {
            // Property in destination object not set; create it and set its value.
            obj1[p] = obj2[p];
        }
    }
  return obj1;
}


