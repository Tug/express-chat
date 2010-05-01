var Class = require("../vendor/class.js/lib/class").Class;
var sys = require("sys");

var MongoObject = new Class({

  constructor: function(mongoCollection, id) {
    this.mongoCollection = mongoCollection;
    this.id = id;
    this.pairIndex = mongoCollection.getPairIndex(id);
  },

  set: function(field, data, callback) {
    var pair = {};
    pair[field] = data;
    this.mongoCollection.update(this.pairIndex, "$set", pair, callback);
  },

  setElement: function(key, field, data, callback) {
    key.merge(this.pairIndex);
    var pair = {};
    pair[field] = data;
    this.mongoCollection.update(key, "$set", pair, callback);
  },

  add: function(field, data, callback) {
    var pair = {};
    pair[field] = data;
    this.mongoCollection.update(this.pairIndex, "$push", pair, callback);
  },

  append: function(field, data, callback) {
    var pair = {};
    pair[field] = data;
    this.mongoCollection.update(this.pairIndex, "$pushAll", pair, callback);
  },

  remove: function(field, data, callback) {
    var pair = {};
    pair[field] = data;
    this.mongoCollection.update(this.pairIndex, "$pull", pair, callback);
  },

  removeAll: function(field, data, callback) {
    var pair = {};
    pair[field] = data;
    this.mongoCollection.update(this.pairIndex, "$pullAll", pair, callback);
  },

  getData: function(callback) {
    this.mongoCollection.find(this.pairIndex, callback);
  },

  get: function(field, callback) {
    var pair = {};
    pair[field] = 1;
    this.mongoCollection.find(this.pairIndex, pair, callback);
  },
  
  getSlice: function(field, start, callback) {
    //var query = {};
    //query[field] = {$slice: [start, 200]};
    //this.mongoCollection.find(this.pairIndex, query, callback);
    this.get(field , function(err, data) {
      if(!err && data && data.length > start)
        callback(null,data.slice(start));
      else
        callback(new Error("Error getting slice of "+field), null);
    });
  },

  empty: function(field, isarray, callback) {
    if(callback == null) { callback = isarray; isarray = true; }
    var pair = {};
    pair[field] = (isarray) ? [] : {};
    this.mongoCollection.update(this.pairIndex, "$set", pair, callback);
  },

  contains: function(field, value, callback) {
    this.mongoCollection.contains(this.pairIndex, callback);
  }

});

exports.MongoObject = MongoObject;

