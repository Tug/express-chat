var utils = require("express/utils");
var util  = require(PATH_UTIL);
﻿var Class = require(PATH_CLASS).Class;
var EventedBuffer   = require(DIR_UTIL + "/eventedbuffer").EventedBuffer;
var MongoBuffer     = require(DIR_MONGO + "/buffer").MongoBuffer;
var MongoFileBuffer = require(DIR_MONGO + "/filebuffer").MongoFileBuffer;
var MongoRoom       = require(DIR_MONGO + "/room").MongoRoom;
var sys = require("sys");

var Room = new Class({
  extend: {
    createRoomFromDb: function(db, dbroom, save) {
      this.db = db;
      var mongoRoom = new MongoRoom(db.rooms, dbroom.roomID);
      var room = new Room(dbroom.admin);
      room.id = dbroom.roomID;
      if(save == true) {
        room.mongoRoom = mongoRoom;
        room.msgBuffer = new MongoBuffer(mongoRoom, "messages");
        room.usrBuffer = new MongoBuffer(mongoRoom, "users");
        room.fileBuffer = new MongoFileBuffer(mongoRoom);
      }
      room.msgBuffer.relativeId += dbroom.messages.length;
      room.fileBuffer.relativeId += dbroom.files.length;
      for(var user in dbroom.users) room.usrBuffer.remove(user);
      return room;
    }
  },

  constructor: function(adminname) {
    this.id = util.generateRandomString(8);
    this.admin = adminname;
    this.msgBuffer = new EventedBuffer();
    this.usrBuffer = new EventedBuffer();
    this.fileBuffer = new EventedBuffer();
    this.guestId = 1;
    this.relativeIdMsgBuffer = 0;
  },

  save: function(db, serverID) {
    var self = this;
    var createRoom = function(tries) {
      db.rooms.createRoom(self.admin, self.id, serverID, function(err, room) {
        if(err != null && tries --> 0) {
          //sys.puts(err.message);
          self.id = util.generateRandomString(8);
          createRoom();
        } else {
          self.db = db;
          self.mongoRoom = room;
          self.msgBuffer = new MongoBuffer(room, "messages");
          self.usrBuffer = new MongoBuffer(room, "users");
          self.fileBuffer = new MongoFileBuffer(room);
        }
      });
    }
    createRoom(5);
  },

  addMessageListener: function(lastMsgId, session, callback) {
    var nbMsgTot = this.msgBuffer.size();
    sys.puts("MessageListener lastMsgId: "+lastMsgId);
    if(lastMsgId >= nbMsgTot) {
      sys.puts("b1 "+nbMsgTot);
      this.msgBuffer.addListener("added", session, this.id, callback);
    } else {
      sys.puts("b2");
      this.msgBuffer.slice(lastMsgId, callback);
    }
  },

  addUserListener: function(session, callback) {
    this.usrBuffer.addListener("all", session, this.id, callback);
  },

  announceMessage: function(message) {
    this.msgBuffer.add(message);
  },

  announceUserMessage: function(username, message) {
    var msg = utils.escape(username) + ": " + utils.escape(message);
    this.announceMessage(msg);
  },

  announceUser: function(username) {
    this.usrBuffer.add(username);
    var msg = "* " + utils.escape(username) + " joined the room.";
    this.announceMessage(msg);
  },

  announceUserLeft: function(username) {
    this.usrBuffer.remove(username);
    var msg = "* " + utils.escape(username) + " left the room.";
    this.announceMessage(msg);
  },

  announceFile: function(file) {
    this.fileBuffer.add(file);
    var link = "/room/"+this.id+"/files/"+file.id;
    var msg = "* " + utils.escape(file.uploader) + " is sharing <a href=\""+link+"\">"+file.filename+"</a>";
    this.announceMessage(msg);
  },

  createUsername: function() {
    return "Guest " + this.guestId++;
  },

  changeUserName: function(username, newname, callback) {
    var self = this;
    this.getUsers(function(err, users) {
      if(!err && util.find(users, newname) !== -1) {
        callback(new Error("Username already in use"), null);
      } else {
        self.usrBuffer.change(username, newname);
        var msg = "* " + utils.escape(username) + " is now known as " + utils.escape(newname) + ".";
        self.announceMessage(msg);
        callback(null, newname);
      }
    });
  },

  getUsers: function(callback) {
    this.usrBuffer.slice(0, callback);
  },

  getFileInfo: function(fileId, callback) {
    this.fileBuffer.get(fileId, callback);
  },

  userExist: function(username, callback) {
    this.usrBuffer.contains(username, callback);
  }

});

exports.Room = Room;

