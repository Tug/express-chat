var util = require(PATH_UTIL);
var MongoBuffer = require("./buffer").MongoBuffer;
var MongoFile = require("./file").MongoFile;
var Step = require(DIR_VENDORS + "/step/lib/step");
var fs = require("fs");

var MongoFileBuffer = MongoBuffer.extend({

  constructor: function(mongoObject) {
    MongoBuffer.call(this, mongoObject, "files", 1*60);
    this.db = mongoObject.getDb();
    this.mongoFiles = {};
  },
  
  backup: function(self) {
    var thisfunction = this;
    Step(
      function removeFromDB() {
        if(self.rmUpdates.length > 0) {
          self.rmUpdates.forEach(function(file) {
            self.mongoFiles[file.id].remove();
            delete self.mongoFiles[file.id];
            this();
          });
        } else this();
      },
      function saveInDB() {
        if(self.buffer.length > 0) {
          var parallel = this.parallel;
          self.buffer.forEach(function(file) {
            self.mongoFiles[file.id].save(file.tempfile, parallel());
          });
        } else this();
      },
      function removeFromDisk() {
        if(self.buffer.length > 0) {
          var parallel = this.parallel;
          self.buffer.forEach(function(file) {
            fs.unlink(file.tempfile, function(err) {
              delete self.mongoFiles[file.id];
              parallel()();
            });
          });
        } else this();
      },
      function end() {
        MongoBuffer.prototype.backup.call(thisfunction, self);
      });
  },

  add: function(el) {
    MongoBuffer.prototype.add.call(this, el);
    this.mongoFiles[el.id] = new MongoFile(this.db, el.id, { filename: el.filename });
  },

  remove: function(el) {
    MongoBuffer.prototype.remove.call(this, el);
    delete this.mongoFiles[el.id];
  },

  change: function(el1, el2) {
    MongoBuffer.prototype.change.call(this, el1, el2);
    delete this.mongoFiles[el1.id];
    this.mongoFiles[el2.id] = new MongoFile(this.db, el2.id, { filename: el2.filename });
  },

  get: function(elId, callback) {
    var i = this.find(elId);
    if(i != -1)
      callback(null, this.buffer[i]);
    else {
      var self = this;
      this.mongoObject.getObject(this.arrayField, elId, function(err, fileInfo) {
        var file = new MongoFile(self.db, elId);
        file.getData(function(err, data) {
          fs.writeFile(fileInfo.tempfile, data, function(err, r) {
            callback(null, fileInfo);
          });
        });
      });
    }
  },

  find: function(elId) {
    for(var i=0; i<this.buffer.length; i++) 
      if(this.buffer[i].id == elId)
        return i;
    return -1;
  }

});

exports.MongoFileBuffer = MongoFileBuffer;

