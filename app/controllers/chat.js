
module.exports = function(app, model) {

    var Room = model.mongoose.model('Room')
      , Message = model.mongoose.model('Message')
      , Counter = model.mongoose.model('Counter')
      , IP = model.mongoose.model('IP')
      , Step = app.libs.Step;
    
    var anonCounter = new Counter({_id: "Anon"});

    var MAX_MESSAGE_LEN     = app.config.limits.maxMessageLength;
    var MAX_USERNAME_LEN    = app.config.limits.maxUsernameLength;

    var chatIOUrl     = app.routes.io("chat.socket");
    
    var actions = {};

    actions.index = function(req, res, next) {
        var roomid = req.params.roomid;
        Room.findOne({_id: roomid}, function(err, room) {
            if(err || !room) {
                res.redirect(app.routes.url("index.index"));
                return;
            }
            var roomName = room.title || "Room "+room.id;
            res.render('chat.html', { title: roomName });
        });
    };

    /*
     * Always authorize
     */
    actions.authorizeSocket = function(socket, next) {
        var req = socket.request;
        next();
    };

    actions.socket = function(socket) {
        var req = socket.request;
        var hs = socket.handshake;
        
        var sroomid = null;
        if(!req.session.rooms) {
            req.session.rooms = {};
        }
        
        socket.on('join room', function(roomid, lastMessageNum, callback) {
            if(typeof callback !== "function") {
                return;
            }
            if(typeof roomid !== "string" || roomid.length > 64) {
                callback('roomid invalid');
                return;
            }
            if(typeof lastMessageNum !== "number" || lastMessageNum < 0) {
                callback('lastMessageNum invalid');
                return;
            }
            
            sroomid = roomid;
            Step(
                function reloadSession() {
                    req.session.reload(this);
                },
                function userExists() {
                    var next = this;
                    // TODO: verify when this case happens
                    // if the session of the user contains an object for this room
                    // we reuse this object (the page was probably refreshed)
                    // and try to force disconnect the previous socket
                    if(req.session.rooms[roomid]) {
                        var userinfo = req.session.rooms[roomid];
                        var username = userinfo.username;
                        var sid = userinfo.sid;
                        if(sid && sid != socket.id && app.io.sockets[sid]) { // disconnect previous socket
                            app.io.sockets[sid].disconnect();
                        }
                        next(null, username);
                    } else {
                        next(null, false);
                    }
                },
                function generateUsername(err, username) {
                    var next = this;
                    if(username) {
                        next(null, username);
                        return;
                    }
                    Counter.getNextValue(roomid, function(errc, value) {
                        if(errc || value == null) {
                            callback('server could not generate a username : '+errc.message);
                            return;
                        }
                        if(value == 1) username = "OP";
                        else username = "Anonymous"+value;
                        next(null, username);
                    });
                },
                function sendUsername(err, username) {
                    var next = this;
                    req.session.rooms[roomid] = {
                        username  : username
                      , sid       : socket.id
                    };
                    callback(null, username);
                    socket.broadcast.to(roomid).json.emit('user joined', username);
                    next(null, username);
                },
                function addUser(err, username) {
                    var next = this;
                    Room.findByIdAndUpdate(roomid, {"$addToSet": {users: username}}, function(err) {
                        next(); // next even if error
                    });
                },
                function sendMessagesAndUsers() {
                    var messageCallback = this.parallel();
                    var userCallback = this.parallel();
                    Message.allFrom(roomid, lastMessageNum+1, function(err, messages) {
                        if(!err && messages) {
                            messages.forEach(function(msg) {
                                socket.emit("new message", msg.publicFields()); 
                            });
                        }
                        messageCallback();
                    });
                    Room.findById(roomid, "users", function(err, room) {
                        if(!err && room) {
                            socket.emit('users', room.users);
                        }
                        userCallback();
                    });
                },
                function joinRoom() {
                    var next = this;
                    socket.join(roomid);
                    req.session.save(next);
                },
                function ready() {
                    socket.emit('ready');
                }
            );
        });

        socket.on('message', function(data) {
            if(typeof data !== "string" || data.length > MAX_MESSAGE_LEN) {
                return;
            }
            if(!req.session.rooms || !req.session.rooms[sroomid]) {
                return;
            }
            Step(
                function canChat() {
                    var nextstep = this;
                    IP.loadFromSocket(socket, function(err, ip) {
                        if(!ip.canChat()) {
                            socket.emit('new message', { username: "system", body: "No flood !"});
                        } else {
                            ip.chat(nextstep);
                        }
                    });
                },
                function chat() {
                    var userinfo = req.session.rooms[sroomid];
                    var username = userinfo.username;
                    var message = new Message({
                        roomid: sroomid,
                        username: username,
                        body: data,
                        userip: socket.handshake.address.address
                    });
                    message.save(function(err) {
                        if(err) console.log(err);
                        app.io.of(chatIOUrl).in(sroomid).emit('new message', message.publicFields());
                    });
                }
            );
        });

        socket.on('change name', function(data, callback) {
            if(typeof callback !== "function") {
                return;
            }
            if(typeof data !== "string" || data.length > MAX_USERNAME_LEN) {
                callback('username invalid');
                return;
            }
            var newname = data;
            Step(
                function reloadSession() {
                    req.session.reload(this);
                },
                // TODO: make $addToSet an $pull into one atomic operation
                // Forbidden by MongoDB for now : https://jira.mongodb.org/browse/SERVER-1050
                function addNewUsername(err) {
                    var next = this;
                    if(err) return next(err);
                    if(!req.session.rooms || !req.session.rooms[sroomid]) {
                        callback('user info not found');
                        return;
                    }
                    var oldname = req.session.rooms[sroomid].username;
                    Room.update({
                        _id: sroomid,
                        users: { $ne: newname }
                    }, {
                        "$addToSet": { users: newname }
                    }, function(err, updated) {
                        if(err) return next(err);
                        if(updated < 1) {
                            callback('username exist');
                        } else {
                            next(null, oldname);
                        }
                    });
                },
                function removeOldUsername(err, oldname) {
                    var next = this;
                    if(err) return next(err);
                    Room.update({ _id: sroomid }, {
                        "$pull": { users: oldname }
                    }, function(err) {
                        next(null, oldname);
                    });
                },
                function updateUserInfo(err, oldname) {
                    var next = this;
                    if(err) return next(err);
                    req.session.rooms[sroomid].username = newname;
                    req.session.save(function(err) {
                        next(err, oldname);
                    });
                },
                function notifyUsernameChange(err, oldname) {
                    var next = this;
                    if(err) return next(err);
                    var renameObj = {oldname: oldname, newname: newname};
                    socket.broadcast.to(sroomid).json.emit('user renamed', renameObj);
                    callback(null, renameObj);
                },
                function handleError(err) {
                    if(err) console.error(err);
                }
            );
        });
        
        socket.on('disconnect', function () {
            if(req.session.rooms && req.session.rooms[sroomid]) {
                var username = req.session.rooms[sroomid].username;
                Room.findByIdAndUpdate(sroomid, {"$pull": {users: username}}, function(err, doc) {
                    socket.broadcast.to(sroomid).json.emit("user left", username);
                });
            }
        });
        
    };

    return actions;
    
};


