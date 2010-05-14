var configuration = require("./config").configuration;
for(var key in configuration.globals) { global[key] = configuration.globals[key]; }

﻿var MyDB = require(DIR_MONGO + "/mydb").MyDB;
var sys = require("sys");

var db = new MyDB();

db.connect(function(err, db) {
  db.clear(function(err, result) {
    sys.puts("DB clean !");
    process.exit(0);
  });
});

