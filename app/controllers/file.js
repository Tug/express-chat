
module.exports = function(app, model) {

    var mongoose = model.mongoose,
        FileModel = mongoose.model('File'),
        MessageModel = mongoose.model('Message'),
        db = model.mongodb,
        GrowingFile = require('growing-mongofile'),
        Step = app.libs.step;

    var actions = {};

    var MAX_SIMUL_UP = app.config.upload.maxSimulUp;
    var MAX_UP_MB = app.config.upload.maxUpMB;
    var SPEED_TARGET_KBs = app.config.upload.speedTargetKBs;
    var chatIOUrl = app.routes.io("chat.socket");
    var fileIOUrl = app.routes.io("file.socket");

    actions.upload = function(req, res, error) {
        var roomid = req.params.roomid;
        var filesize = req.form.fileInfo.filesize;
        var userip = req.connection.remoteAddress;
        var filename = req.form.fileInfo.filename;
        
        // we store the username in the socket object
        // and the socket ids (one for each room) in the session
        
        if(!req.session.rooms) {
            error(new Error('user is not connected to any room'));
            return;
        }

        var socketid = req.session.rooms[roomid];

        if(!socketid) {
            error(new Error('client not found in room'));
            return;
        }
        
        Step(
            function loadUser() {
                var nextstep = this;
                app.io.sockets.socket(socketid).get('userinfo', function(err, userinfo) {
                    if(err || !userinfo || !userinfo.username) {
                        error(new Error('user info not found'));
                        return;
                    }
                    
                    nextstep(null, userinfo.username);
                });
            },
            function createFile(err, username) {
                var nextstep = this;
                var file = new FileModel({
                    originalname  : filename,
                    uploaderip    : userip,
                    uploadername  : username,
                    size          : filesize
                });
                file.save(function(err) {
                    if(err) {
                        next(err);
                        return;
                    }
                    nextstep(null, file);
                });
            },
            function createGridStore(err, file) {
                var nextstep = this;
                var servername = file.servername;
                var filename = file.originalname;
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
                    id: file.servername,
                    status: file.status,
                    percent: 0
                };
                
                var totalRead = 0;
                req.form.onChunk = function(data, callback) {
                    gs.write(data, function() {
                        totalRead += data.length;
                        var newProgress = Math.floor(100*totalRead/file.size);
                        if(newProgress > fileStatus.percent) {
                            fileStatus.percent = newProgress;
                            app.io.of(fileIOUrl).in(fileStatus.id).emit('status', fileStatus);
                        }
                        callback();
                    });
                };
                
                req.form.on('close', function() {
                    gs.close(function(err, result) {
                        res.send('ok');
                        file.status = "Completed";
                        file.save(function(err) {
                            fileStatus.status = file.status;
                            app.io.of(fileIOUrl).in(fileStatus.id).emit('status', fileStatus);
                        });
                    });
                });

                req.form.on('error', function(err) {
                    console.log(err);
                    file.remove(function(err) {
                        fileStatus.status = file.status;
                        app.io.of(fileIOUrl).in(fileStatus.id).emit('status', fileStatus);
                        error(err);
                    });
                });

                req.form.on('aborted', function() {
                    console.log("client has disconnected");
                    gs.unlink(function(err) {
                        file.remove(function(err) {
                            fileStatus.status = file.status;
                            app.io.of(fileIOUrl).in(fileStatus.id).emit('status', fileStatus);
                            error(err);
                        });
                    });
                });
            },
            function start(err, file) {
                var nextstep = this;
                req.form.read();
                nextstep(err, file);
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
        FileModel.findOne({servername: servername}, function(err, file) {
            if(err || !file) {
                error(err || new Error('File not found'));
                return;
            }
            if(file.status == 'Removed') {
                error(new Error("File has been removed !"));
                return;
            }
            GrowingFile.open(db, servername, null, function(err, gf) {
                if(err || !gf || !gf.originalname) {
                    error(err || new Error('File not found'));
                    return;
                }
                var filename = gf.originalname;
                var filesize = gf.filesize;
                console.log("downloading "+filename+ " (size : "+filesize+")");
                res.contentType(filename);
                res.attachment(filename);
                res.header('Content-Length', filesize);
                gf.pipe(res);
            });
        });
        
    };

    actions.socket = function(socket) {
        var hs = socket.handshake;
        
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
            socket.join(roomid);
            socket.set('roomid', roomid, function() {
                if(!hs.session.rooms) {
                    hs.session.rooms = {};
                }
                hs.session.rooms[roomid] = socket.id;
                hs.session.save(callback);
            });
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

        socket.on('disconnect', function() {
            if(!hs.session || !hs.session.rooms) {
                return;
            }
            socket.get('roomid', function(err, roomid) {
                if(hs.session.rooms[roomid]) {
                    delete hs.session.rooms[roomid];
                    hs.session.save();
                }
            });
        });
    };

    return actions;
    
}
