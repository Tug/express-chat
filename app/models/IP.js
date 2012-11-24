
var mongoose = require('mongoose');

module.exports = function(app, model) {
    
    var clientIP = app.libs.util.clientIP;
    
    var MAX_SIMUL_UP    = app.config.limits.maxSimulUp;
    var MAX_SIMUL_DOWN  = app.config.limits.maxSimulDown;
    var MAX_UP          = app.config.limits.maxUpMB   * 1024 * 1024;
    var MAX_DOWN        = app.config.limits.maxDownMB * 1024 * 1024;
    var RELOAD_TIME     = app.config.limits.reloadTimeMin * 60 * 1000;

    var IP = new mongoose.Schema({
        ip          : { type: String, index: true }
      , lastsaved   : Date
      , simulUp     : { type: Number, default: 0 }
      , simulDown   : { type: Number, default: 0 }
      , uploaded    : { type: Number, default: 0 }
      , downloaded  : { type: Number, default: 0 }
    });

    IP.pre('save', function(next) {
        this.lastsaved = new Date();
        next();
    });
    
    IP.statics.load = function(req, next) {
        var cip = clientIP(req);
        IPModel.findOne({ip: cip}, function(err, doc) {
            if(doc) {
                next(null, doc);
                return;
            }
            var ip = new IPModel({ip: cip});
            ip.save(function(err) {
                next(null, ip);
            });
        });
    };
    
    IP.methods.addDownloaded = function(value, next) {
        this.downloaded += value;
        return this.save(next);
    };
    
    IP.methods.addUploaded = function(value, next) {
        this.uploaded += value;
        return this.save(next);
    };

    IP.methods.newUpload = function(next) {
        this.simulUp += 1;
        return this.save(next);
    };

    IP.methods.newDownload = function(next) {
        this.simulDown += 1;
        return this.save(next);
    };

    IP.methods.uploadFinished = function(next) {
        this.simulUp -= 1;
        return this.save(next);
    };

    IP.methods.downloadFinished = function(next) {
        this.simulDown -= 1;
        return this.save(next);
    };

    IP.methods.canUpload = function(bytes) {
        if(this.hasServedTime()) this.reset();
        return (this.uploaded + bytes <= MAX_UP);
    };

    IP.methods.canDownload = function(bytes) {
        if(this.hasServedTime()) this.reset();
        return (this.downloaded + bytes <= MAX_DOWN);
    };

    IP.methods.hasServedTime = function() {
        return Date.now() - this.lastsaved.getTime() >= RELOAD_TIME;
    };

    IP.methods.reset = function(next) {
        this.simulUp = 0;
        this.simulDown = 0;
        this.uploaded = 0;
        this.downloaded = 0;
        this.save(next);
    };
    
    var IPModel = model.mongoose.model('IP', IP);
    return IPModel;
}

