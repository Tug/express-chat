var Class = require("../vendor/class.js/lib/class").Class;
var util = require("./util");
var sys = require("sys");

var EventedBuffer = new Class({

  constructor: function() {
    this.buffer = [];
    this.callbacks = {
        added: [],
        removed: [],
        modified: [],
        all: []
    };
    //setInterval(this.reapDeadCallbacks, 1000);
  },

  slice: function(start, callback) {
    callback(null, this.buffer.slice(start) );
  },

  add: function(el) {
    this.buffer.push(el);
    this.callThemAll("added", [el]);
  },

  remove: function(el) {
    var i = util.find(this.buffer, el);
    this.buffer.splice(i,1);
    this.callThemAll("removed", [el]);
  },

  change: function(el1, el2) {
    var i = util.find(this.buffer, el1);
    this.buffer.splice(i,1,el2);
    this.callThemAll("modified", [el1, el2]);
  },

  callThemAll: function(eventType, data) {
    while(this.callbacks[eventType].length > 0) {
      this.callbacks[eventType].shift().callback(null, data);
    }
    var pair = {};
    pair[eventType] = data;
    while(this.callbacks.all.length > 0) {
      this.callbacks.all.shift().callback(null, pair);
    }
  },

  addListener: function(eventType, session, callback) {
    this.callbacks[eventType].push({ session: session, callback: callback });
  },

  reapDeadCallbacks: function() {
    var now = new Date();
    for(var callbacksByType in this.callbacks) {
      var i=callbacksByType.length;
      while(i --> 0) {
        var callback = this.callbacksByType[i];
        if(!callback.session.alive) {
          this.callbacksByType.splice(i,1);
          callback.callback([]);
        }
      }
    }
  },

  size: function() {
    return this.buffer.length;
  },

  empty: function() {
    this.buffer = [];
  }

});

exports.EventedBuffer = EventedBuffer;

