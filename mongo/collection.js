var Class = require('../util/class').Class;

var MongoCollection = new Class({

  constructor: function(collection, indexKey) {
    this.collection = collection;
    this.indexKey = indexKey;
  },

  getPairIndex: function(id) {
    var jsonObj = {};
    jsonObj[this.indexKey] = id;
    return jsonObj;
  },

  count: function(id, callback) {
    this.collection.count(callback);
  },

  contains: function(id, callback) {
    this.collection.count(id, function(err, n) {
      callback(null, new Boolean(n));
    });
  },

  find: function(id, callback) {
    this.collection.findOne( id, callback );
  },

  findAll: function(id, callback) {
    this.collection.find(id, function(err, cursor) {
      cursor.toArray(callback);
    });
  },

  add: function(data, callback) {
    this.collection.insert( data, callback );
  },

  get: function(id, callback) {
    var pair = {};
	pair[this.indexKey] = id;
    this.collection.findOne( pair, callback );
  },

  update: function(spec, operation, data, callback) {
	var pair = {};
	pair[operation] = data;
    this.collection.update( spec, pair, callback );
  },

  addUnique: function(data, callback) {
    var self = this;
    self.contains(this.getPairIndex(data[this.indexKey]), function(err, exist) {
      if(exist == true) callback(new Error("id already present!"), null);
      else {
        self.collection.insert( data, function(err, objs) {
          callback(null, objs[0]);
        });
      }
    });
  }

});

exports.MongoCollection = MongoCollection;

