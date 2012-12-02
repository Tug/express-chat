
var args        = process.argv.splice(2)
  , configFile  = args[0] || './config.json'
  , fs          = require('fs')
  , userconfig  = JSON.parse(fs.readFileSync(configFile, 'utf8'))
  , config      = require('../config')(userconfig)
  , mongo       = require(application_root+"/lib/mongo");

mongo.autoload({}, config.database.mongo, function(err, db) {
    db.dropDatabase(function(err, done) {
        console.log(err || "Database "+((!done)?"NOT ":"")+"droped !");
        process.exit(0);
    });
});

