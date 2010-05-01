var Class = require("../vendor/class.js/lib/class").Class;

var User = new Class({

  extend: {
    getUserName: function(usr) {
      return usr.name
    }
  },

  constructor: function(name) {
    this.name = name;
  }

});

exports.User = User;

