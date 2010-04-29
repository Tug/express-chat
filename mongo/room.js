var MongoObject = require("./object").MongoObject;

var MongoRoom = MongoObject.extend({

  constructor: function(rooms, id) {
    MongoObject.call(this, rooms, id);
  },

  addMessage: function(msg, callback) {
    this.add("messages", msg, callback);
  },

  addUser: function(user, callback) {
    this.add("users", user, callback);
  },

  addMessages: function(msgs, callback) {
    this.append("messages", msgs, callback);
  },

  addUsers: function(users, callback) {
    this.append("users", users, callback);
  },

  setUsers: function(users, callback) {
    this.set("users", users, callback);
  },

  changeUserName: function(user, newname, callback) {
    this.setElement( {"users.id": user.id}, { "$set" : { "users.$.name" : newname } }, callback);
  },

  getUsers: function(callback) {
    this.get("users", callback);
  },

  getUser: function(id, callback) {
    var self = this;
    //TODO: rewrite this function with a query
    this.getUsers(function(err, users) {
      if(users) {
        for(var i=0; i<users.length; i++) {
          var usr = users[i];
          if(usr.id == id) {
            callback(null, usr);
            return;
          }
        }
      }
      callback(err, null);
    });
  },

  getMessages: function(callback) {
    this.get("messages", callback);
  },

  getLastMessages: function(lastMsgId, callback) {
    this.getMessages(function(err, messages) {
      if(messages && messages.length > lastMsgId) {
        //TODO: check if better with cursor
        callback(null, messages.slice(lastMsgId));
      } else {
        callback(new Error("No message after "+lastMsgId), null);
      }
    });
  }

});

exports.MongoRoom = MongoRoom;

