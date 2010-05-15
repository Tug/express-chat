var MongoCollection = require("./collection").MongoCollection;
var MongoRoom = require("./room").MongoRoom;

var MongoRooms = MongoCollection.extend({

  createRoom: function(admin, id, serverId, ispublic, callback) {
    var self = this;
    var room =
    { admin: admin
    , server: serverId
    , ispublic: ispublic
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
  },

  getPublicRooms: function(callback) {
    this.findAll({ "ispublic": true }, {"roomID":1}, function(err, res) {
      if(err) callback(err,null);
      else {
        var rooms = [];
        for(var i=0; i<res.length; i++) {
          var roomObj = res[i];
          rooms.push(roomObj.roomID);
        }
        callback(null, rooms);
      }
    });
  }

});

exports.MongoRooms = MongoRooms;

