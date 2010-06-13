var Class = require(PATH_CLASS).Class
var fs = require("fs");
var sys = require("sys");
var spawn = require("child_process").spawn;


var MongoFile = new Class({

  constructor: function(filePath) {
    this.filePath = filePath;
    this.inTempFolder = true;
    this.inDb = false;
    this.downloaders = 0;
  },

  save: function(callback) {
    sys.puts("saving "+this.filePath);
    if(this.inDb) callback(null, true);
    else if(!this.inTempFolder) callback(null, false);
    else {
      var savecommand = spawn(PATH_MONGOFILES, ["-d", DB_NAME, "put", this.filePath]);
      var self = this;
      savecommand.addListener('exit', function (code) {
        sys.puts("saved");
        self.inDb = true;
        callback(null, code == 0);
      });
    }
  },

  download: function(callback) {
    this.downloaders++;
    sys.puts("downloading "+this.filePath);
    if(this.inTempFolder) callback(null, true);
    else if(!this.inDb) callback(null, false);
    else {
      var dlcommand = spawn(PATH_MONGOFILES, ["-d", DB_NAME, "get", this.filePath]);
      sys.puts("written in tmp folder");
      var self = this;
      dlcommand.addListener('exit', function (code) {
        self.inTempFolder = true;
        callback(null, code == 0);
      });
    }
  },

  removeFromDisk: function(callback) {
    var self = this;
    if(this.downloaders == 0) {
      fs.unlink(this.filePath, function(err, res) {
        self.inTempFolder = false;
        if(callback) callback(null, true);
      });
    } else if(callback) callback(null, false);
  },

  removeFromDb: function(callback) {
    var rmcommand = spawn(PATH_MONGOFILES, ["-d", DB_NAME, "delete", this.filePath]);
    var self = this;
    rmcommand.addListener('exit', function (code) {
      self.inDb = false;
      if(callback) callback(null, code == 0);
    });
  },

  downloadFinished: function(callback) {
    this.downloaders--;
    if(this.downloaders == 0) {
      this.removeFromDisk(callback);
    }
  }

});


exports.MongoFile = MongoFile;

