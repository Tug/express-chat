
var mongoose = require("mongoose");
var config = require('../config.js')();
var conn = mongoose.createConnection(config.database.mongo.uri, function(err) {
    conn.db.dropDatabase(function(err, done) {
        console.log(err || "Database "+config.database.mongo.uri+((!done)?" NOT ":" ") +"droped !");
        process.exit(0);
    });
});

