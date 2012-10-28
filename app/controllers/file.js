
module.exports = function(app, model) {

    var mongoose      = model.mongoose
      , FileModel     = mongoose.model('File')
      , MessageModel  = mongoose.model('Message')
      , IPModel       = mongoose.model('IP')
      , db            = model.mongodb
      , GrowingFile   = require('growing-mongofile')
      , Step          = require('step');

    var actions       = {};

    var MAX_SIMUL_UP      = app.config.limits.maxSimulUp;
    var MAX_UP_MB         = app.config.limits.maxUpMB;
    var SPEED_TARGET_KBs  = app.config.limits.speedTargetKBs;
    
    var chatIOUrl     = app.routes.io("chat.socket");
    var fileIOUrl     = app.routes.io("file.socket");

    actions.upload = function(req, res, error) {
        var roomid    = req.params.roomid
          , filesize  = req.form.fileInfo.filesize
          , filename  = req.form.fileInfo.filename;
        
        if(typeof roomid !== "string" || roomid.length > 16) {
            error('Invalid Room ID');
            return;
        }

        if(typeof filename !== "string" || filename.length > 255) {
            error('Invalid Filename');
            return;
        }
        
        // we store the username in the socket object
        // and the socket ids (one for each room) in the session
        if(!req.session.rooms || !req.session.rooms[roomid]) {
            error(new Error('User is not connected!'));
            return;
        }

        var username = req.session.rooms[roomid].username;

        if(!username) {
            error(new Error("client's name not found"));
            return;
        }
        
        Step(
            function loadIP() {
                var nextstep = this;
                IPModel.load(req, function(err, ip) {
                    if(err || !ip) {
                        error(err);
                    } else if(ip.canUpload(filesize)) {
                        nextstep(null, ip);
                    } else {
                        error(new Error("Upload limit exceeded"));
                    }
                });
            },
            function createFile(err, ip) {
                var nextstep = this;
                var file = new FileModel({
                    originalname  : filename
                  , uploaderip    : ip.ip
                  , uploadername  : username
                  , size          : filesize
                });
                file.save(function(serr) {
                    if(serr) {
                        error(serr);
                        return;
                    }
                    nextstep(null, ip, file);
                });
            },
            function createGridStore(err, ip, file) {
                var nextstep = this;
                var servername = file.servername;
                var meta = {filesize: filesize, originalname: file.originalname};
                var gs = GrowingFile.createGridStore(db, servername, meta, function(err, gs) {
                    if(err || !gs) {
                        error(new Error('Error creating gridstore : '+(err && err.message)));
                        return;
                    }
                    nextstep(null, file);
                });
                
                req.form.speedTarget = SPEED_TARGET_KBs;

                var fileStatus = {
                    id: servername,
                    status: file.status,
                    percent: 0
                };

                ip.newUpload();

                function transferOver(err) {
                    ip.uploadFinished();
                    file.save(function(serr) {
                        fileStatus.status = file.status;
                        app.io.of(fileIOUrl).in(fileStatus.id).emit('status', fileStatus);
                    });
                }

                var totalRead = 0;
                req.form.onChunk = function(data, callback) {
                    gs.write(data, function() {
                        totalRead += data.length;
                        var newProgress = Math.floor(100*totalRead/file.size);
                        if(newProgress > fileStatus.percent) {
                            fileStatus.percent = newProgress;
                            app.io.of(fileIOUrl).in(fileStatus.id).emit('status', fileStatus);
                        }
                        ip.addUploaded(data.length);
                        callback();
                    });
                };
                
                req.form.on('close', function() {
                    gs.close(function(err, result) {
                        res.send('ok');
                        file.status = "Available";
                        transferOver();
                    });
                });

                req.form.on('error', function(err) {
                    console.log(err);
                    file.status = "Removed";
                    transferOver(err);
                });

                req.form.on('aborted', function() {
                    gs.unlink(function(err) {
                        file.status = "Removed";
                        transferOver(err);
                    });
                });
            },
            function start(err, file) {
                var nextstep = this;
                req.form.read();
                nextstep(null, file);
            },
            function announceFile(err, file) {
                var fileurl = app.routes.url("file.download", {roomid: roomid, fileid: file.servername });
                var message = MessageModel.createEmptyFileMessage(roomid, file);
                message.save(function(err) {
                    if(err) {
                        error(err);
                        return;
                    }
                    MessageModel
                    .findById(message._id)
                    .populate("_attachment")
                    .exec(function (err, msg) {
                        app.io.of(chatIOUrl).in(roomid).json.emit("new message", msg.publicFields());
                    });
                });
            }
        );
        
        
    };

    actions.download = function(req, res, error) {
        var servername = req.params.fileid;
        
        if(typeof servername !== "string" || servername.length > 16) {
            error('Invalid file ID');
            return;
        }
        
        Step(
            function findFile() {
                var nextstep = this;
                FileModel.findOne({servername: servername}, function(err, file) {
                    if(err || !file) {
                        error(err || new Error('File not found'));
                        return;
                    }
                    if(file.status == 'Removed') {
                        error(new Error("File has been removed !"));
                        return;
                    }
                    nextstep(null, file);
                });
            },
            function loadIP(err, file) {
                var nextstep = this;
                IPModel.load(req, function(err, ip) {
                    if(ip && ip.canDownload(file.size)) {
                        nextstep(err, ip);
                    } else {
                        error(new Error("Download limit exceeded"));
                    }
                });
            },
            function openFile(err, ip) {
                GrowingFile.open(db, servername, null, function(oerr, gf) {
                    if(oerr || !gf || !gf.originalname) {
                        error(oerr || new Error('File not found'));
                        return;
                    }
                    var filename = gf.originalname;
                    var filesize = gf.filesize;
                    console.log("downloading "+filename+ " (size : "+filesize+")");
                    res.contentType(filename);
                    res.attachment(filename);
                    res.header('Content-Length', filesize);
                    gf.pipe(res);
                    ip.newDownload();
                    ip.addDownloaded(filesize);
                    gf.on('end', function() {
                        ip.downloadFinished();
                    });
                });
            }
        );
        
    };

    actions.socket = function(socket) {
        var hs      = socket.handshake
          , sroomid = null;
        
        socket.on('user register', function(roomid, callback) {
            if(typeof callback !== "function") {
                return;
            }
            if(typeof roomid !== "string" || roomid.length > 64) {
                callback('roomid invalid');
                return;
            }
            if(!hs.session) {
                callback('session expired');
                return;
            }
            sroomid = roomid;
            callback();
        });

        socket.on('file watch', function(fileid) {
            FileModel
            .findOne({'servername': fileid})
            .exec(function(err, file) {
                if(err || !file) {
                    return;
                }
                if(file.status == 'Uploading') {
                    socket.join(fileid);
                } else {
                    socket.emit("status", file.publicFields());
                }
            });
        });

        socket.on('file unwatch', function(fileid) {
            socket.leave(fileid);
        });

    };

    return actions;
    
}
