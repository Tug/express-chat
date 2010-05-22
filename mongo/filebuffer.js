var util = require(PATH_UTIL);
var MongoBuffer = require("./buffer").MongoBuffer;
var MongoFile = require("./file").MongoFile;
var Step = require(DIR_VENDORS + "/step/lib/step");
var fs = require("fs");
var isset = require(PATH_PHPJS).isset;

var MongoFileBuffer = MongoBuffer.extend({

  constructor: function(mongoObject) {
    MongoBuffer.call(this, mongoObject, "files");
    this.db = mongoObject.getDb();
    this.mongoFiles = {};
    this.rmTempFiles = {};
  },
  
  backup: function(self) {
    var thisfunction = this;
    Step(
      function removeFromDB() {
        if(self.rmUpdates.length > 0) {
          self.rmUpdates.forEach(function(file) {
            var tmp = self.mongoFiles[file.id];
            delete self.mongoFiles[file.id];
            tmp.removeFromDb(this);
          });
        } else this();
      },
      function saveInDB() {
        if(self.buffer.length > 0) {
          var parallel = this.parallel;
          self.buffer.forEach(function(file) {
            self.mongoFiles[file.id].save(parallel());
          });
        } else this();
      },
      function removeFromDisk() {
        if(self.buffer.length > 0) {
          var parallel = this.parallel;
          self.buffer.forEach(function(file) {
            self.mongoFiles[file.id].removeFromDisk(parallel());
          });
        } else this();
      },
      function end() {
        MongoBuffer.prototype.backup.call(thisfunction, self);
      });
  },

  add: function(el) {
    MongoBuffer.prototype.add.call(this, el);
    this.mongoFiles[el.id] = new MongoFile(el.tempfile);
  },

  remove: function(el) {
    MongoBuffer.prototype.remove.call(this, el);
    delete this.mongoFiles[el.id];
  },

  change: function(el1, el2) {
    MongoBuffer.prototype.change.call(this, el1, el2);
    delete this.mongoFiles[el1.id];
    this.mongoFiles[el2.id] = new MongoFile(el2.tempfile);
  },

  getInfo: function(elId, callback) {
    var i = this.find(elId);
    if(i != -1)
      callback(null, this.buffer[i]);
    else
      this.mongoObject.getObject(this.arrayField, elId, callback);
  },
  
  getFile: function(elId, callback) {
    var self = this;
    this.getInfo(elId, function(err, fileInfo) {
      if(err) callback(err, null, null);
      else
        if(isset(self.mongoFiles[elId]))
          callback(null, self.mongoFiles[elId], fileInfo);
        else {
          var file = new MongoFile(fileInfo.tempfile);
          self.mongoObject[elId] = file
          callback(null, file, fileInfo);
        }
    });
  },

  pullFile: function(elId, callback) {
    var self = this;
    self.getFile(elId, function(err, file, fileInfo) {
      if(err) callback(err, null);
      else
        file.download(callback);
    });
  },

  find: function(elId) {
    for(var i=0; i<this.buffer.length; i++) 
      if(this.buffer[i].id == elId)
        return i;
    return -1;
  }

});

exports.MongoFileBuffer = MongoFileBuffer;

