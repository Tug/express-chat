var utils = require("express/utils");
var util  = require(PATH_UTIL);
﻿var Class = require(PATH_CLASS).Class;
var EventedBuffer   = require(DIR_UTIL + "/eventedbuffer").EventedBuffer;
var MongoBuffer     = require(DIR_MONGO + "/buffer").MongoBuffer;
var MongoFileBuffer = require(DIR_MONGO + "/filebuffer").MongoFileBuffer;
var MongoRoom       = require(DIR_MONGO + "/room").MongoRoom;
var sys             = require("sys");

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
      dbroom.users.forEach(function(user) {
        room.usrBuffer.remove(user);
      });
      return room;
    }
  },

  constructor: function(params) {
    if(isset(params.id)) this.id = params.id;
    else this.id = util.generateRandomString(8);
    if(isset(params.admin)) this.admin = params.admin;
    else this.admin = this.createUsername();
    this.msgBuffer = new EventedBuffer();
    this.usrBuffer = new EventedBuffer();
    this.fileBuffer = new EventedBuffer();
    this.guestId = 1;
    this.relativeIdMsgBuffer = 0;
  },

  save: function(db, serverID, ispublic) {
    var self = this;
    var createRoom = function(tries) {
      db.rooms.createRoom(self.admin, self.id, serverID, ispublic, function(err, room) {
        if(isset(err) && tries --> 0) {
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
    if(lastMsgId >= nbMsgTot) {
      this.msgBuffer.addListener("added", session, this.id, callback);
    } else {
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
    username = utils.escape(username);
    this.usrBuffer.add(username);
    var msg = "* " + username + " joined the room.";
    this.announceMessage(msg);
  },

  announceUserLeft: function(username) {
    this.usrBuffer.remove(username);
    var msg = "* " + username + " left the room.";
    this.announceMessage(msg);
  },

  announceFile: function(file) {
    this.fileBuffer.add(file);
    var link = "/room/"+this.id+"/files/"+file.id;
    var msg = "* " + utils.escape(file.uploader) + " is sharing <a href=\""+link+"\">"+utils.escape(file.filename)+"</a>";
    this.announceMessage(msg);
  },

  createUsername: function() {
    return "Guest " + this.guestId++;
  },

  changeUserName: function(username, newname, callback) {
    var self = this;
    newname = utils.escape(newname);
    this.getUsers(function(err, users) {
      if(isset(err))
        callback(err, null);
      else if(util.find(users, newname) !== -1)
        callback(new Error("Username already in use"), null);
      else {
        self.usrBuffer.change(username, newname);
        var msg = "* " + username + " is now known as " + newname + ".";
        self.announceMessage(msg);
        callback(null, newname);
      }
    });
  },

  getUsers: function(callback) {
    this.usrBuffer.slice(0, callback);
  },

  getFileInfo: function(fileId, callback) {
    this.fileBuffer.getInfo(fileId, callback);
  },

  getFile: function(fileId, callback) {
    this.fileBuffer.getFile(fileId, callback);
  },

  userExist: function(username, callback) {
    this.usrBuffer.contains(username, callback);
  }

});

exports.Room = Room;

