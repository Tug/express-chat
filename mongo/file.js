var util = require(PATH_UTIL);
var MongoBuffer = require("./buffer").MongoBuffer;
﻿var mongo = require(DIR_VENDORS + "/node-mongodb-native/lib/mongodb");
var Step = require(DIR_VENDORS + "/step/lib/step").Step;
var fs = require("fs");

var MongoFile = new Class({

  constructor: function(db, filename, metadata) {
    var meta = metadata || null;
    this.gridStore = new mongo.GridStore(db, filename, "w", {"metadata": meta});
    this.isopen = false;
  },

  append: function(data, callback) {
    var self = this;
    self.checkMode("w+");
    Step(
      function open(err,input) {
        self.open(this);
      },
      function append(err,input) {
        self.gridStore.write(data, callback);
      });
  },

  insertAt: function(index, data, callback) {
    var self = this;
    self.checkMode("w");
    Step(
      function open(err,input) {
        self.open(this);
      },
      function seek(err, input) {
        gridStore.seek(index, this);
      },
      function write(err, input) {
        gridStore.write(data, callback);
      });
  },

  save: function(file, callback) {
    var self = this;
    fs.readFile(file, function(err, data) {
      self.write(data.toString(), function(err, gridStore) {
        self.close(function(err, res) {
          self.isopen = false;
          callback(err, res);
        });
      });
    });
  },

  write: function(data, callback) {
    this.open(function(err, gridStore) {
      gridStore.write(data, callback);
    });
  },

  getData: function(callback) {
    mongo.GridStore.read(this.gridStore.db, this.gridStore.filename, callback);
  },

  exist: function() {
    mongo.GridStore.exist(this.gridStore.db, this.gridStore.filename, callback);
  },

  remove: function() {
    mongo.GridStore.unlink(this.gridStore.db, this.gridStore.filename, callback);
  },

  open: function(callback) {
    var self = this;
    if(self.isopen == false) {
      self.gridStore.open(function(err, gridStore) {
        self.isopen = true;
        callback(err, gridStore);
      });
    } else callback(null, self.gridStore);
  },

  close: function(callback) {
    var self = this;
    if(self.isopen == true) {
      self.gridStore.close(function(err, res) {
        self.isopen = false;
        callback(err, res);
      });
    } else callback(null, null);
  },

  checkMode: function(mode) {
    if(self.gridStore.mode != mode) {
      self.gridStore.mode = mode;
    }
  }

});

exports.MongoFile = MongoFile;

