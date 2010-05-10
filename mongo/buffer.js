var sys = require("sys");
var util = require("../util/util");
var Step = require("../vendor/step/lib/step");
var EventedBuffer = require("../util/eventedbuffer").EventedBuffer;


var MongoBuffer = EventedBuffer.extend({

  constructor: function(mongoObject, arrayField) {
    EventedBuffer.call(this);
    this.mongoObject = mongoObject;
    this.arrayField = arrayField;
    this.relativeId = 0;
    this.rmUpdates = [];
    //setInterval(this.backup, 30*1000);
  },

  backup: function() {
    var self = this;
    Step(
      function remove() {
        if(self.rmUpdates.length > 0) {
          var copyRmUp = self.rmUpdates.slice();
          self.relativeId -= self.rmUpdates.length;
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
    if(start < 0 || start >= nbTot) {
      callback(new Error("element index out of buffer's bounds"), null);
    } else {
      if(start >= this.relativeId) {
        callback(null, this.buffer.slice(start-this.relativeId));
      } else if(this.mongoObject) {
        var self = this;
        this.mongoObject.getSlice(this.arrayField, start, function(err, arr) {
          if(err) {
            callback(err, []);
          } else {
            arr.concat(self.buffer);
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
    this.callThemAll("modified", [el1, el2]);
  },

  size: function() {
    return this.buffer.length + this.relativeId;
  }

});

exports.MongoBuffer = MongoBuffer;

