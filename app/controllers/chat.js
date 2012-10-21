
module.exports = function(app, model) {

    var Room = model.mongoose.model('Room'),
        Message = model.mongoose.model('Message'),
        Counter = model.mongoose.model('Counter');
        Step = app.libs.step;
    
    var redis = model.redis;
    var redisClient = redis.createClient();
    var anonCounter = new Counter({_id: "Anon"});

    var actions = {};

    actions.index = function(req, res, next) {
        var roomid = req.params.roomid;
        Room.findOne({_id: roomid}, function(err, room) {
            if(err || !room) {
                res.redirect(app.routes.url("index.index"));
                return;
            }
            var roomName = room.title || "Room "+room.id;
            res.render('chat.html', {title: roomName});
        });
    };

    actions.socket = function(socket) {
        var hs = socket.handshake;
        
        socket.on('join room', function(roomid, callback) {
            if(typeof callback !== "function") {
                return;
            }
            if(typeof roomid !== "string" || roomid.length > 64) {
                callback('roomid invalid');
                return;
            }
            var username = null;
            Step(
                function generateUsername() {
                    var next = this;
                    Counter.getNextValue(roomid, function(err, value) {
                        if(err || value == null) {
                            callback('server could not generate a username : '+err.message);
                            return;
                        }
                        username = "Anonymous"+value;
                        callback(null, username);
                        var userinfo = {
                            roomid: roomid,
                            username: username
                        };
                        next(null, userinfo);
                    });
                },
                function setUserInfo(err, userinfo) {
                    socket.set('userinfo', userinfo, this);
                },
                function sendMessagesAndUsers() {
                    var messageCallback = this.parallel();
                    var userCallback = this.parallel();
                    Message.allFrom(roomid, 1, function(err, messages) {
                        if(!err && messages) {
                            messages.forEach(function(msg) {
                                socket.emit("new message", msg.publicFields()); 
                            });
                        }
                        messageCallback();
                    });
                    redisClient.smembers(roomid+" users", function(err, users) {
                        socket.emit('users', users);
                        userCallback();
                    });
                },
                function addUser() {
                    // TODO: check if not present
                    redisClient.sadd(roomid+' users', username, this);
                },
                function announceUser() {
                    socket.join(roomid);
                    socket.broadcast.to(roomid).json.emit('user joined', username);
                    socket.emit('ready');
                }
            );
        });

        socket.on('message', function(data) {
            if(typeof data !== "string" || data.length > 500) {
                return;
            }
            socket.get('userinfo', function(err, userinfo) {
                if(err || !userinfo) {
                    return;
                }
                var roomid = userinfo.roomid;
                var username = userinfo.username;
                var message = new Message({
                    roomid: roomid,
                    username: username,
                    body: data,
                    userip: socket.handshake.address.address
                });
                message.save(function(err) {
                    if(err) console.log(err);
                    socket.broadcast.to(roomid).json.emit('new message', message.publicFields());
                });
            });
        });

        socket.on('change name', function(data, callback) {
            if(typeof callback !== "function") {
                console.log('username change without callback');
                return;
            }
            if(typeof data !== "string" || data.length > 50) {
                callback('username invalid');
                return;
            }
            var newname = data;
            socket.get('userinfo', function(err, userinfo) {
                if(err || !userinfo) {
                    callback('user info not found');
                    return;
                }
                var oldname = userinfo.username;
                var roomid = userinfo.roomid;
                Step(
                    function checkUsername() {
                        var next = this;
                        redisClient.sismember(roomid+' users', newname, function(err, ismemb){
                            if(err || ismemb === 1) {
                                callback('username exist');
                            } else next();
                        });
                    },
                    function updateUsernameInRedis() {
                        var next = this;
                        redisClient.srem(roomid+' users', oldname, function() {
                            redisClient.sadd(roomid+' users', newname, function() {
                                next();
                            });
                        });
                    },
                    function updateUserInfo() {
                        userinfo.username = newname;
                        socket.set('userinfo', userinfo, this);
                    },
                    function notifyUsernameChange() {
                        var renameObj = {oldname: oldname, newname: newname};
                        socket.broadcast.to(roomid).json.emit('user renamed', renameObj);
                        callback(null, renameObj);
                    }
                );
            });
        });
        
        socket.on('disconnect', function () {
            socket.get('userinfo', function(err, userinfo) {
                if(err || !userinfo) {
                    return;
                }
                var username = userinfo.username;
                var roomid = userinfo.roomid;
                redisClient.srem(roomid+' users', username, function() {
                    socket.broadcast.to(roomid).json.emit("user left", username);
                    //socket.leave(roomid);
                });
            });
        });
        
    };

    return actions;
    
}


