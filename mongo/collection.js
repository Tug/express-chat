var Class = require(PATH_CLASS).Class;

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

  count: function(callback) {
    this.collection.count(callback);
  },

  contains: function(id, callback) {
    this.collection.count(this.getPairIndex(id), function(err, n) {
      callback(null, new Boolean(n));
    });
  },

  get: function(id, callback) {
    this.collection.findOne(this.getPairIndex(id), callback);
  },

  add: function(data, callback) {
    this.collection.insert( data, callback );
  },

  update: function(spec, operation, data, callback) {
	  var pair = {};
	  pair[operation] = data;
    this.collection.update( spec, pair, callback );
  },

  find: function(spec, fields, callback) {
    if(!callback) { callback = fields; fields = null; }
    this.collection.find(spec, fields, function(err, cursor) {
      cursor.nextObject(callback);
    });
  },

  findAll: function(spec, fields, callback) {
    if(!callback) { callback = fields; fields = null; }
    this.collection.find(spec, fields, function(err, cursor) {
      cursor.toArray(callback);
    });
  },

  addUnique: function(data, callback) {
    var self = this;
    self.contains(data[this.indexKey], function(err, exist) {
      if(exist == true) callback(new Error("id already present!"), null);
      else {
        self.collection.insert( data, function(err, objs) {
          callback(null, objs[0]);
        });
      }
    });
  },

  remove: function(spec, callback) {
    this.collection.remove(spec, callback);
  },

  getDb: function() {
    return this.collection.db;
  }

});

exports.MongoCollection = MongoCollection;

