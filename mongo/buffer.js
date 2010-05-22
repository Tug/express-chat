var util = require(PATH_UTIL);
var Step = require(DIR_VENDORS + "/step/lib/step");
var EventedBuffer = require(DIR_UTIL + "/eventedbuffer").EventedBuffer;
var array_diff = require(PATH_PHPJS).array_diff;

var MongoBuffer = EventedBuffer.extend({

  constructor: function(mongoObject, arrayField, backupIntSec) {
    EventedBuffer.call(this);
    this.mongoObject = mongoObject;
    this.arrayField = arrayField;
    this.relativeId = 0;
    this.rmUpdates = [];
    var self = this;
    backupIntSec = backupIntSec || 30;
    setInterval(function() { self.backup(self); }, backupIntSec*1000);
  },

  backup: function(self) {
    Step(
      function remove() {
        if(self.rmUpdates.length > 0) {
          var copyRmUp = self.rmUpdates.slice();
          self.relativeId -= copyRmUp.length;
          self.rmUpdates = [];
          self.mongoObject.removeAll(self.arrayField, copyRmUp, this);
        } else this();
      },
      function add(err,input) {
        if(self.buffer.length > 0) {
          var copyBuff = self.buffer.slice();
          self.relativeId += self.buffer.length;
          self.buffer = [];
          self.mongoObject.append(self.arrayField, copyBuff, this);
        } else this();
      });
  },

  slice: function(start, callback) {
    var nbTot = this.size();
    if(start < 0 || start > nbTot) {
      callback(new Error("element index out of buffer's bounds"), null);
    } else {
      if(start >= this.relativeId) {
        callback(null, this.buffer.slice(start-this.relativeId));
      } else if(this.mongoObject) {
        var self = this;
        this.mongoObject.getSlice(this.arrayField, start, function(err, arr) {
          if(isset(err))
            callback(err, []);
          else {
            arr = arr.concat(self.buffer);
            if(self.rmUpdates.length > 0)
              arr = array_diff(arr, self.rmUpdates);
            callback(null, arr);
          }
        });
      }
    }
  },

  add: function(el) {
    var i = util.find(this.rmUpdates, el);
    if(i === -1) {
      this.buffer.push(el);
    } else {
      this.rmUpdates.splice(i,1);
    }
    this.callThemAll("added", [el]);
  },

  remove: function(el) {
    var i = this.find(el);
    if(i === -1) {
      this.rmUpdates.push(el);
    } else {
      this.buffer.splice(i,1);
    }
    this.callThemAll("removed", [el]);
  },

  change: function(el1, el2) {
    var i = this.find(el1);
    if(i === -1) {
      this.rmUpdates.push(el1);
      this.buffer.push(el2);
    } else {
      this.buffer.splice(i,1,el2);
    }
    this.callThemAll("modified", [[el1, el2]]);
  },

  size: function() {
    return this.buffer.length + this.relativeId;
  },

  contains: function(el, callback) {
    if(this.find(el) != -1)
      callback(null, true);
    else
      this.mongoObject.contains(el, callback);
  },

  // useless function
  get: function(el, callback) {
    this.contains(el, function(err, res) {
      if(res == true)
        callback(null, el);
      else
        callback(new Error("Element <"+JSON.stringify(el)+"> does not exist in the buffer"), el);
    });
  }

});

exports.MongoBuffer = MongoBuffer;

