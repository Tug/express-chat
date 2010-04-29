var Class = require("../util/class").Class;
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
    this.getData(function(err, obj) {
      var data = obj[field];
      callback(err, data);
    });
  },
  //TODO: use mongodb slice
  getSlice: function(field, start, callback) {
    this.getData(function(err, obj) {
      var data = obj[field];
      callback(err, data.slice(start));
    });
  },

  empty: function(field, isarray, callback) {
    if(callback == null) { callback = isarray; isarray = true; }
    var pair = {};
    if(isarray) {
      pair[field] = [];
    } else {
      pair[field] = {};
    }
    this.mongoCollection.update(this.pairIndex, "$set", pair, callback);
  },

  contains: function(field, value, callback) {
    this.mongoCollection.find(this.pairIndex, "$set", value, callback);
  }

});

exports.MongoObject = MongoObject;

