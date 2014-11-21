
var debug = require('debug')('autoload');

exports.autoload = function(app, model, mongoConfig, callback) {

    callback = callback || function(err) { if(err) debug(err); };

    var options = mongoConfig.options || {};
    if( options && options.db && options.db.safe && options.db.safe.w == 'all' ) {
        options.db.safe.w = mongoConfig.servers.length;
    }
    
    var connStr = 'mongodb://';

    if(options && options.user && options.pass ) {
        connStr += options.user+":"+options.pass+"@";
    }
    
    connStr += mongoConfig.servers.join(',');

    // force keepAlive
    options.server = options.server || {};
    options.replset = options.replset || {};
    options.server.socketOptions = { keepAlive: 1 };
    options.replset.socketOptions = { keepAlive: 1 };

    model.mongoose = app.libs.mongoose.createConnection(connStr, options, function() {
        debug('Connected to MongoDB!');
        model.mongo = model.mongoose.db;
        // allow dropDb if we are not in prod (to avoid human mistake in using the config)
        // this feature is very useful for the "testing" env
        if(mongoConfig.dropDb === true && process.env.NODE_ENV !== "production") {
            model.mongoose.db.dropDatabase(function(err) {
                callback(err, model.mongo);
            })
        } else {
            callback(null, model.mongo);
        }
    });

    model.mongoose.db.on("error", function(err) {
        console.log("MongoDB "+err);
    });

    // use visionmedia/debug module to debug mongoose requests
    var debugMongoose = require("debug")("mongoose");
    app.libs.mongoose.set('debug', function(collectionName, method, query, doc, options) {
        debugMongoose('%s.%s(%s) %s %s'
            , collectionName
            , method
            , print(query)
            , print(doc)
            , print(options));
    });
}


/*
 * utils functions to print mongoose requests nicely
 * copied from mongoose internal code
 */

var utils = require("mongoose/lib/utils");

/*!
 * Debug print helper
 */

function print (arg) {
  var type = typeof arg;
  if ('function' === type || 'undefined' === type) return '';
  return format(arg);
}

/*!
 * Debug print helper
 */

function format (obj, sub) {
  var x = utils.clone(obj);
  if (x) {
    if ('Binary' === x.constructor.name) {
      x = '[object Buffer]';
    } else if ('ObjectID' === x.constructor.name) {
      var representation = 'ObjectId("' + x.toHexString() + '")';
      x = { inspect: function() { return representation; } };
    } else if ('Date' === x.constructor.name) {
      var representation = 'new Date("' + x.toUTCString() + '")';
      x = { inspect: function() { return representation; } };
    } else if ('Object' === x.constructor.name) {
      var keys = Object.keys(x)
        , i = keys.length
        , key
      while (i--) {
        key = keys[i];
        if (x[key]) {
          if ('Binary' === x[key].constructor.name) {
            x[key] = '[object Buffer]';
          } else if ('Object' === x[key].constructor.name) {
            x[key] = format(x[key], true);
          } else if ('ObjectID' === x[key].constructor.name) {
            ;(function(x){
              var representation = 'ObjectId("' + x[key].toHexString() + '")';
              x[key] = { inspect: function() { return representation; } };
            })(x)
          } else if ('Date' === x[key].constructor.name) {
            ;(function(x){
              var representation = 'new Date("' + x[key].toUTCString() + '")';
              x[key] = { inspect: function() { return representation; } };
            })(x)
          } else if (Array.isArray(x[key])) {
            x[key] = x[key].map(function (o) {
              return format(o, true)
            });
          }
        }
      }
    }
    if (sub) return x;
  }

  return require('util')
    .inspect(x, false, 10, true)
    .replace(/\n/g, '')
    .replace(/\s{2,}/g, ' ')
}

