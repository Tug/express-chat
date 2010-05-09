var sys = require("sys");
var util = require("../util/util");
var MongoBuffer = require("./buffer").MongoBuffer;
﻿var mongo = require("../vendor/node-mongodb-native/lib/mongodb");
var Step = require("../vendor/step/lib/step").Step;


var MongoFile = new Class({

  constructor: function(db, filename, meta) {
    var meta = metadata || null;
    this.gridStore = new mongo.GridStore(db, filename, "w", {"metadata": meta});
    this.open = false;
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
      }
    });
  },

  save: function(file, callback) {
    var self = this;
    fs.readFile(file, function (err, data) {
      self.gridStore.write(data, function(err, gridStore) {
        gridStore.close(function(err, result) {
          self.open = false;
          callback(err);
        });
      });
    });
  },

  write: function(data, callback) {
    var self = this;
    this.gridStore.write(data, function(err, gridStore) {
      gridStore.close(function(err, data) {
        self.open = false;
        callback(err, data);
      });
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
    if(self.open == false) {
      self.gridStore.open(function(err, gridStore) {
        self.open = true;
        callback();
      });
    } else callback();
  },

  checkMode: function(mode) {
    if(self.gridStore.mode != mode) {
      self.gridStore.mode = mode;
    }
  }

});

exports.MongoFile = MongoFile;

