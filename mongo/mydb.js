var Class = require(PATH_CLASS).Class;
var MongoDB = require("./db").MongoDB;
var MongoRooms = require("./rooms").MongoRooms;
var util = require(PATH_UTIL);

var MyDB = MongoDB.extend({

  constructor: function() {
    MongoDB.call(this, DB_NAME);
    this.rooms = null;
  },

  createRooms: function(callback) {
    var self = this;
    this.createCollection("rooms", ["roomID", "files.id"], function(err, collection) {
      util.cast(collection, MongoRooms);
      self.rooms = collection;
      callback(err, self.rooms);
    });
  }

});

exports.MyDB = MyDB;

