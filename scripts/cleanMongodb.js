
var mongodb = require('mongodb');
var config = require('../config.js')();
var options = config.database.mongodb;
var db = new mongodb.Db(options.db, new mongodb.Server(options.host, options.port, {}));
db.open(function(err, db) {
    db.dropDatabase(function(err, result){
        console.log(err || 'ok');
        process.exit(0);
    });
});