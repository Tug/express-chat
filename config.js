
var path = require('path');

global.application_root = __dirname;

var config = {
    hostname  : 'localhost',
    port      : 3000,
    database  : {
        mongo : {
            servers : [
                'localhost:27017/express-chat'
            ],
            options : {
                server : {
                    auto_reconnect: true
                },
                db : {
                    safe          : true
                }
            }
        },
        redis : {
            host: 'localhost',
            port: 6379
        }
    },
    // express.js settings
    settings  : {
        'debug'         : false,
        'env'           : process.env.NODE_ENV || "development",
        'trust proxy'   : false,
        //'view cache'    : false, // enabled in production by default
        //'views'         : "app/views", // will be set to paths.views
        'view engine'   : 'html'
    },
    engines : {
        'html': require('ejs-locals')
    },
    paths : {
          root        : application_root,
          routes      : path.join(application_root, 'urls.js'),
          app         : path.join(application_root, 'app'),
          public_root : path.join(application_root, 'public'),
          public_lib  : path.join(application_root, 'public', 'lib'),
          models      : path.join(application_root, 'app', 'models'),
          views       : path.join(application_root, 'app', 'views'),
          libs        : path.join(application_root, 'app', 'libs'),
          controllers : path.join(application_root, 'app', 'controllers'),
          conf        : path.join(application_root, 'app', 'conf'),
         // crons       : path.join(application_root, 'app', 'crons'),
          favicon     : path.join(application_root, 'public', 'favicon.ico'),
          statics     : {
            '/static'           : path.join(application_root, 'public'),
            '/static/server_lib': path.join(application_root, 'app', 'libs')
        }
    },
    session : {
        secret  : 'CHANGE_ME',
        key     : 'nirror.sid',
        cookie  : {
            maxAge    : 24 * 60 * 60 * 1000, // 1 day
            path      : '/',
            httpOnly  : true
        },
        reapInterval  : 15 * 60 * 1000,
        engine  : 'mongo'
    },
    socketio : {
        adapter: "redis"
    },
    limits : {
        maxMessageLength  : 3000,
        maxUsernameLength : 50,
        minMessageInterval: 1000, //ms
        maxTotalUp        : 200,  // files
        maxTotalDown      : 2000, // files
        maxSimulUp        : 1,
        maxSimulDown      : 3,
        maxUpMB           : 1000,
        maxDownMB         : 10000,
        uploadSpeedKBs    : 500,
        downloadSpeedKBs  : 500,
        reloadTimeMin     : 6 * 60
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


