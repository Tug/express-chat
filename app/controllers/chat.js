
module.exports = function(app, model) {

    var Room = model.mongoose.model('Room')
        , Message = model.mongoose.model('Message')
        , Counter = model.mongoose.model('Counter')
        , IP = model.mongoose.model('IP')
        , Step = app.libs.Step;

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

    function handleError(err) {
        if(err) {
            console.error(err.stack || err);
        }
    }

    /*
     * Always authorize
     */
    actions.authorizeSocket = function(socket, next) {
        var req = socket.request;
        next();
    };

    actions.joinRoom = function(socket, roomid, lastMessageNum, callback) {
        callback = (typeof callback === "function") ? callback : handleError;
        if(typeof roomid !== "string" || roomid.length > 64) {
            return callback('roomid invalid');
        }
        if(typeof lastMessageNum !== "number" || lastMessageNum < 0) {
            return callback('lastMessageNum invalid');
        }

        var req = socket.request;
        socket.roomid = roomid;

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
    };

    actions.changeName = function(socket, data, callback) {
        callback = (typeof callback === "function") ? callback : handleError;
        if(typeof data !== "string" || data.length > MAX_USERNAME_LEN) {
            return callback('username invalid');
        }
        var req = socket.request;
        var roomid = socket.roomid;
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
                if(!req.session.rooms || !req.session.rooms[roomid]) {
                    callback('user info not found');
                    return;
                }
                var oldname = req.session.rooms[roomid].username;
                Room.update({
                    _id: roomid,
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
                Room.update({ _id: roomid }, {
                    "$pull": { users: oldname }
                }, function(err) {
                    next(null, oldname);
                });
            },
            function updateUserInfo(err, oldname) {
                var next = this;
                if(err) return next(err);
                req.session.rooms[roomid].username = newname;
                req.session.save(function(err) {
                    next(err, oldname);
                });
            },
            function notifyUsernameChange(err, oldname) {
                var next = this;
                if(err) return next(err);
                var renameObj = {oldname: oldname, newname: newname};
                socket.broadcast.to(roomid).json.emit('user renamed', renameObj);
                callback(null, renameObj);
            },
            function handleError(err) {
                if(err) console.error(err);
            }
        );
    };

    actions.receiveMessage = function(socket, data, callback) {
        callback = (typeof callback === "function") ? callback : handleError;
        if(typeof data !== "string" || data.length > MAX_MESSAGE_LEN) {
            return callback("Invalid parameters");
        }
        var req = socket.request;
        var roomid = socket.roomid;
        if(!req.session.rooms || !req.session.rooms[roomid]) {
            return callback("Not connected to this room");
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
                var userinfo = req.session.rooms[roomid];
                var username = userinfo.username;
                var message = new Message({
                    roomid: roomid,
                    username: username,
                    body: data,
                    userip: socket.handshake.address.address
                });
                message.save(function(err) {
                    if(err) console.log(err);
                    app.io.of(chatIOUrl).in(roomid).emit('new message', message.publicFields());
                    callback(err);
                });
            }
        );
    };

    actions.disconnect = function(socket, callback) {
        callback = (typeof callback === "function") ? callback : handleError;
        var req = socket.request;
        var roomid = socket.roomid;
        if(req.session.rooms && req.session.rooms[roomid]) {
            var username = req.session.rooms[roomid].username;
            Room.findByIdAndUpdate(roomid, {"$pull": {users: username}}, function(err, doc) {
                socket.broadcast.to(roomid).json.emit("user left", username);
                callback(err);
            });
        } else {
            callback();
        }
    };

    actions.socket = function(socket) {
        var req = socket.request;

        socket.roomid = null;
        req.session.rooms = req.session.rooms || {};

        socket.on('join room', actions.joinRoom.bind(null, socket));
        socket.on('message', actions.receiveMessage.bind(null, socket));
        socket.on('change name', actions.changeName.bind(null, socket));
        socket.on('disconnect', actions.disconnect.bind(null, socket));
    };

    return actions;

};


