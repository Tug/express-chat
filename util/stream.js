var Class = require(PATH_CLASS).Class;
var array_fill_keys = require(PATH_PHPJS).array_fill_keys;
var array_merge = require(PATH_PHPJS).array_merge;
var sys = require("sys");

var Stream = new Class({

  constructor: function(events) {
    this.readable = true;
    this.events = array_merge(events || [], ["data", "error", "end"]);
    this.resetCallbacks();
  },

  addListener: function(event, callback) {
    if(this.callbacks.hasOwnProperty(event))
      this.callbacks[event] = callback;
    else
      throw new Error("addListener: event property '"+event+"' is not supported!");
    return this;
  },

  callback: function(event, data) {
    this.callbacks[event](data);
  },

  data: function(data) {
    this.callback("data", data);
  },

  end: function() {
    sys.puts("end");
    this.callback("end");
    this.resetCallbacks();
  },

  error: function(err) {
    sys.puts("error");
    this.readable = false;
    this.callback("error", err);
    this.resetCallbacks();
  },

  resetCallbacks: function() {
    this.callbacks = array_fill_keys(this.events, null);
  }

});

exports.Stream = Stream;
