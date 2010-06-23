// Express-chat - Copyright (C) 2010 T. de Kerviler <dekervit@gmail.com> (GPL)

﻿var MongoCollection = require("./collection").MongoCollection;
var MongoRoom = require("./room").MongoRoom;
var MongoFile = require("./file").MongoFile;
var util  = require(PATH_UTIL);
var sys = require("sys");

var MongoRooms = MongoCollection.extend({

  createRoom: function(admin, id, serverId, ispublic, callback) {
    var self = this;
    var room =
    { admin: admin
    , server: serverId
    , ispublic: ispublic
    , date: new Date()
    , users: []
    , messages: []
    , files: []
    };
    room[this.indexKey] = id;
    this.addUnique(room, function(err, r) {
      if(isset(err))
        callback(new Error("Collision in room id"), null);
      else
        callback(null, new MongoRoom(self, id));
    });
  },

  getPublicRooms: function(callback) {
    this.findAll({ "ispublic": true }, {"roomID":1}, function(err, res) {
      if(isset(err))
        callback(err,null);
      else {
        var rooms = [];
        for(var i=0; i<res.length; i++) {
          var roomObj = res[i];
          rooms.push(roomObj.roomID);
        }
        callback(null, rooms);
      }
    });
  },

  removeOldRooms: function(callback) {
    var limitDate = new Date();
    limitDate.setDate(limitDate.getDate());
    var spec = {"date": { "lt" : limitDate }};
    this.remove(spec, callback);
    /*
    var self = this;
    this.findAll(spec, {"files":1}, function(err, list) {
      if(isset(err) || !isset(list)) if(callback) callback(err, null);
      else {
        var files = [];
        list.forEach(function(room) { files.append(room.files); });
        if(files.length > 0) {
          util.arrayChain(files, function(file) {
            var mongoFile = new MongoFile(file.tempfile);
            mongoFile.removeFromDb(this);
          }, function() {
            self.remove(spec, callback);
          });
        } else {
          self.remove(spec, callback);
        }
      }
    });
    */
  }

});

exports.MongoRooms = MongoRooms;

