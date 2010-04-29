var MyDB = require("./mydb").MyDB;
var sys = require("sys");

var db = new MyDB();

db.connect(function(err, db) {
  db.clear(function(err, result) {
    sys.puts("DB clean !");
  });
});

