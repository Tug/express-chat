var MongoCollection = require("./collection").MongoCollection;
var MongoRoom = require("./room").MongoRoom;

var MongoRooms = MongoCollection.extend({

  createRoom: function(admin, id, serverId, callback) {
    var self = this;
    var room =
    { admin: admin
    , server: serverId
    , users: []
    , messages: []
    , files: []
    };
    room[this.indexKey] = id;
    this.addUnique(room, function(err, r) {
      if(err != null) {
        callback(new Error("Collision in room id"), null);
      } else {
        callback(null, new MongoRoom(self, id));
      }
    });
  }

});

exports.MongoRooms = MongoRooms;

