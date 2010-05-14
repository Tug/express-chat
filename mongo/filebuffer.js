var util = require(PATH_UTIL);
var MongoBuffer = require("./buffer").MongoBuffer;
var MongoFile = require("./file").MongoFile;
var Step = require(DIR_VENDORS + "/step/lib/step");

var MongoFileBuffer = MongoBuffer.extend({

  constructor: function(mongoObject) {
    MongoBuffer.call(this, mongoObject, "files");
    this.db = mongoObject.getDb();
    this.mongoFiles = {};
  },
  
  backup: function(self) {
    Step(
      function removeFromDB() {
        if(self.rmUpdates.length > 0) {
          self.rmUpdates.forEach(function(file) {
            self.mongoFiles[file.id].remove();
            delete self.mongoFiles[file.id];
          });
        } else this();
      },
      function saveInDB(err, input) {
        if(self.buffer.length > 0) {
          var parallel = this.parallel;
          self.buffer.forEach(function(file) {
            self.mongoFiles[file.id].save(file.tempFile, parallel());
          });
        } else this();
      },
      function cleanFromDisk(err, input) {
        var parallel = this.parallel;
        self.buffer.forEach(function(file) {
          fs.unlink(file.tempFile, parallel());
        });
      },
      function end(){
        MongoBuffer.call(self);
      });
  },

  add: function(fileInfo) {
    MongoBuffer.call(this, fileInfo);
    this.mongoFiles[fileInfo.id] = new MongoFile(this.db, fileInfo.id, { "filename": fileInfo.filename });
  },

  remove: function(el) {
    MongoBuffer.call(this, el);
    delete this.mongoFiles[el.id];
  },

  change: function(el1, el2) {
    MongoBuffer.call(this, el1, el2);
    delete this.mongoFiles[el1.id];
    this.mongoFiles[el2.id] = new MongoFile(this.db, el2.id, { "filename": el2.filename });
  }

});

exports.MongoFileBuffer = MongoFileBuffer;

