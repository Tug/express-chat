var mongo = require("../vendor/node-mongodb-native/lib/mongodb");
var Class = require("../vendor/class.js/lib/class").Class;
var MongoCollection = require("./collection").MongoCollection;
var sys = require("sys");

/*
 * MongoDB Class handler
 */
var MongoDB = new Class({
  
  constructor: function(dbName) {
    this.dbName = dbName;
    this.host = process.env["MONGO_NODE_DRIVER_HOST"] != null ? process.env["MONGO_NODE_DRIVER_HOST"] : "localhost";
    this.port = process.env["MONGO_NODE_DRIVER_PORT"] != null ? process.env["MONGO_NODE_DRIVER_PORT"] : mongo.Connection.DEFAULT_PORT;
    this.client = null;
  },

  connect: function(callback) {
    this.client = new mongo.Db(this.dbName, new mongo.Server(this.host, this.port, {auto_reconnect: true}, {}));
    var self = this;
    try {
      self.client.open(function(err, db){
        callback(err, self);
      });
    } catch(err) {
      sys.puts("Error connecting to "+this.dbName+": "+err.message);
    }
  },

  close: function() {
    this.client.close();
  },

  clear: function(callback) {
    this.client.dropDatabase(callback);
  },

  createCollection: function(name, indexes, callback) {
    var self = this;
    this.client.collection(name, function(err, collection) {
      if(err) sys.puts("Error creating collection "+name+": "+err.message);
      var formatedId = ["meta"];
      formatedId.push(["_id", 1]);
      indexes.map(function(index){ formatedId.push([index, 1]); });
      collection.createIndex(formatedId, function(err, rname) {
        var collec = new MongoCollection(collection, indexes[0]);
        callback(null, collec);
      });
    });
  }
 
});

exports.MongoDB = MongoDB;
