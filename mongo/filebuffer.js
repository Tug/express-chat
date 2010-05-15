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
            delete self.mongoFiles[file.id];
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

  add: function(el) {
    //MongoBuffer.call(this, fileInfo);
    var i = util.find(this.rmUpdates, el);
    if(i === -1) {
      this.buffer.push(el);
    } else {
      this.rmUpdates.splice(i,1);
    }
    this.callThemAll("added", [el]);
    // end copy paste of the super class
    this.mongoFiles[el.id] = new MongoFile(this.db, el.id, { filename: el.filename });
  },

  remove: function(el) {
    //MongoBuffer.call(this, el);
    var i = this.find(el);
    if(i === -1) {
      this.rmUpdates.push(el);
    } else {
      this.buffer.splice(i,1);
    }
    this.callThemAll("removed", [el]);
    // end copy paste of the super class
    delete this.mongoFiles[el.id];
  },

  change: function(el1, el2) {
    //MongoBuffer.call(this, el1, el2);
    var i = this.find(el1);
    if(i === -1) {
      this.rmUpdates.push(el1);
      this.buffer.push(el2);
    } else {
      this.buffer.splice(i,1,el2);
    }
    this.callThemAll("modified", [[el1, el2]]);
    // end copy paste of the super class
    delete this.mongoFiles[el1.id];
    this.mongoFiles[el2.id] = new MongoFile(this.db, el2.id, { filename: el2.filename });
  },

  get: function(elId, callback) {
    var i = this.find(elId);
    if(i != -1)
      callback(null, this.buffer[i]);
    else
      this.mongoObject.getObject(this.arrayField, elId, callback);
  },

  find: function(elId) {
    for(var i=0; i<this.buffer.length; i++) 
      if(this.buffer[i].id == elId)
        return i;
    return -1;
  }

});

exports.MongoFileBuffer = MongoFileBuffer;

