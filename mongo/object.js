// Express-chat - Copyright (C) 2010 T. de Kerviler <dekervit@gmail.com> (GPL)

var Class = require(PATH_CLASS).Class;
var array_fill_keys = require(PATH_PHPJS).array_fill_keys;
//var array_merge = require(PATH_PHPJS).array_merge;

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
    key = array_merge(key, this.pairIndex);
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

  get: function(fields, callback) {
    var pairs = array_fill_keys(fields, 1);
    this.mongoCollection.find(this.pairIndex, pairs, function(err, data) {
       callback(null, data);
    });
  },

  getSlice: function(field, start, callback) {
    //var query = {};
    //query[field] = {$slice: [start, 200]};
    //this.mongoCollection.find(this.pairIndex, query, callback);
    this.get([field], function(err, data) {
      if(isset(err) || !isset(data))
        callback(new Error("Error retrieving data (getSlice)"), null);
      else {
        var arr = data[field];
        if(isset(data) && isset(arr) && arr.length > start)
          callback(null, arr.slice(start));
        else
          callback(err, null);
      }
    });
  },

  empty: function(field, isarray, callback) {
    if(callback == null) { callback = isarray; isarray = true; }
    var pair = {};
    pair[field] = (isarray) ? [] : {};
    this.mongoCollection.update(this.pairIndex, "$set", pair, callback);
  },

  exist: function(callback) {
    this.mongoCollection.contains(this.pairIndex, callback);
  },

  contains: function(field, value, callback) {
    var pair = {};
    pair[field] = value;
    pair = array_merge(pair, this.pairIndex);
    this.mongoCollection.find(pair, function(err, cursor) {
      cursor.count(function(err, n) {
        callback(err, n > 0);
      });
    });
  },

  //TODO: find a way to return only one elment of the array.
  getObject: function(field, key, callback) {
    var pair = {};
    pair[field+".id"] = key;
    pair = array_merge(pair, this.pairIndex);
    var limitor = {};
    limitor[field] = 1;
    this.mongoCollection.find(pair, limitor, function(err, obj) {
      if(isset(err)) callback(err, null);
      else if(obj != null && obj[field] != null) {
        var arr = obj[field];
        for(var el in arr) {
          if(arr[el].id == key) {
            callback(null, arr[el]);
            return;
          }
        }
      }
      callback(new Error("Element not found"), null);
    });
  },

  getDb: function() {
    return this.mongoCollection.getDb();
  }

});

exports.MongoObject = MongoObject;

