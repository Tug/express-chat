
var mongoose = require("mongoose");
var config = require('../config.js')();

var mongodb = require('../lib/mongo.js').autoload(config.database.mongo, function() {
    mongodb.dropDatabase(function(err, done) {
        console.log(err || "Database "+config.database.mongo.db+((!done)?" NOT ":" ") +"droped !");
        process.exit(0);
    });
});

