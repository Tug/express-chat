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

  changeUserName: function(username, newname, callback) {
    this.setElement( {"users": username}, { "$set" : { "users.$" : newname } }, callback);
  },

  getUsers: function(callback) {
    this.get("users", callback);
  },

  getMessages: function(callback) {
    this.get("messages", callback);
  },

  getLastMessages: function(lastMsgId, callback) {
    this.MongoObject.getSlice("messages", lastMsgId, function(err, messages) {
      if(messages) {
        callback(null, messages);
      } else {
        callback(new Error("No message after "+lastMsgId), null);
      }
    });
  }

});

exports.MongoRoom = MongoRoom;

