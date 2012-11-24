
var mongoose = require('mongoose')
  , ObjectId = mongoose.Schema.ObjectId
  , mongodb = require('mongodb');

module.exports = function(app, model) {
    
    var util = app.libs.util;
    
    var File = new mongoose.Schema({
          servername      : { type: String, index: { unique: true } }
        , uploaderip      : String
        , uploadername    : String
        , originalname    : String
        , status          : { type: String, enum: ['Uploading','Available','Stopped','Removed'], default: 'Uploading' }
        , size            : Number
        , uploaddate      : { type: Date, default: Date.now }
    });
    
    function generateUniqueId(callback, it) {
        var iter = it || 20;
        var randName = util.randomString(10);
        FileModel.findOne({servername: randName}, function(err, doc) {
          if(err || !doc) {
            callback(null, randName);
          } else {
            if(iter --> 0) {
              generateUniqueId(callback, iter);
            } else {
              callback(new Error("Failed generating unique file id"), null);
            }
          }
        });
    }

    File.pre('save', function(next) {
        var self = this;
        if(!this.servername) {
            generateUniqueId(function(err, uniqueId) {
                if(err || uniqueId == null) next(err);
                else {
                    self.servername = uniqueId;
                    next();
                }
            }, 5);
        } else next();
    });

    File.pre('remove', function(next) {
        mongodb.GridStore.unlink(model.mongo, this.servername, next);
    });

    File.methods.remove = function(callback) {
        this.status = 'Removed';
        this.save(callback);
    };
    
    File.methods.publicFields = function() {
        return {
            servername    : this.servername
          , originalname  : this.originalname
          , uploadername  : this.uploadername
          , status        : this.status
          , size          : this.size
        };
    };

    var FileModel = model.mongoose.model('File', File);
    return FileModel;

}

