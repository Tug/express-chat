var sys   = require("sys");
var utils = require("express/utils");
var util  = require("./util/util");
var User  = require("./util/user").User;
﻿var Class = require("./vendor/class.js/lib/class").Class;
var EventedBuffer   = require("./util/eventedbuffer").EventedBuffer;
var MongoBuffer     = require("./mongo/buffer").MongoBuffer;
var MongoFileBuffer = require("./mongo/filebuffer").MongoFileBuffer;

var Room = new Class({

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
          sys.puts(err.message);
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
      this.msgBuffer.addListener("added", session, callback);
    } else {
      this.msgBuffer.slice(lastMsgId, callback);
    }
  },

  addUserListener: function(session, callback) {
    this.usrBuffer.addListener("all", session, callback);
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

  announceFile: function(username, file) {
    this.fileBuffer.add(file);
    var msg = "* " + utils.escape(username) + " is sharing "+file.filename;
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
  }

});

exports.Room = Room;

