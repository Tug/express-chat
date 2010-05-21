var util = require(PATH_UTIL);
var MongoBuffer = require("./buffer").MongoBuffer;
﻿var mongo = require(DIR_VENDORS + "/node-mongodb-native/lib/mongodb");
var Step = require(DIR_VENDORS + "/step/lib/step");
﻿var Class = require(PATH_CLASS).Class;
var Stream = require(DIR_UTIL + "/stream").Stream
var fs = require("fs");
var sys = require("sys");

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
      function open() {
        self.open(this);
      },
      function append() {
        self.gridStore.write(data, true, this);
      },
      callback);
  },

  insertAt: function(index, data, callback) {
    var self = this;
    self.checkMode("w");
    Step(
      function open() {
        self.open(this);
      },
      function seek() {
        self.gridStore.seek(index, this);
      },
      function write() {
        self.gridStore.write(data, true, this);
      },
      callback);
  },

  save: function(filepath, fcallback) {
    var self = this;
    var chunkSize = chunkSize || (1024 * 1024);
    var st = new Date();
    util.readFileInChunks(filepath, chunkSize, function(err, data, bytesRead, callback) {
      if(bytesRead != 0) {
        sys.puts(bytesRead+";"+(new Date() - st));
        st = new Date();
        self.append(data.toString(), callback);
      } else {
        self.close(fcallback);
      }
    });
  },

  getStream: function(fileInfo) {
    var self = this;
    var stream = new Stream();
    stream.path = fileInfo.filename;
    self.open(function() {
      var chunkSize = self.gridStore.chunkSize || (1024 * 1024);
      var totalSize = self.gridStore.length;
      var read = function() {
        var bytesToGo = totalSize - self.gridStore.position;
        if(bytesToGo <= 0) stream.end();
        else {
          sys.puts("bytesToGo:"+bytesToGo);
          if(chunkSize > bytesToGo) chunkSize = bytesToGo;
          self.gridStore.read(chunkSize, function(err, data) {
            sys.puts("len="+data.length);
            if(err) stream.error(err);
            else {
              stream.data(data);
              read();
            }
          });
        }
      };
      read(0);
    }); 
    return stream;
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
    if(this.gridStore.mode != mode) {
      this.gridStore.mode = mode;
    }
  }

});


exports.MongoFile = MongoFile;

