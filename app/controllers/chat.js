
module.exports = function(app, model) {

    var Room = model.mongoose.model('Room'),
        Message = model.mongoose.model('Message'),
        Counter = model.mongoose.model('Counter');
        Step = app.libs.step;
    
    var redis = model.redis;
    var redisClient = redis.createClient();
    var anonCounter = new Counter({_id: "Anon"});

    var MAX_MSG_LEN = 500;
    var MAX_USR_LEN = 50;
    var MAX_ROOMID_LEN = 64;

    var actions = {};
    
    actions.create = function(req, res, next) {
        var ispublic = req.body.ispublic || false;
        var room = new Room({ispublic: ispublic});
        room.save(function(err) {
            if(err) {
                console.log(err);
                next(err);
            } else {
                res.redirect(app.url("chat.index", {"roomid": room.id }));
            }
        });
    };

    actions.index = function(req, res, next) {
        res.render('chat.html');
    };

    actions.socket = function(socket) {
        
        socket.on('join room', function(roomid, callback) {
            if(!roomid || roomid.length > MAX_ROOMID_LEN) {
                callback('roomid invalid');
                return;
            }
            var userData = {
                roomid: roomid
            };
            Step(
                function generateUsername() {
                    var next = this;
                    Counter.getNextValue(roomid, function(err, value) {
                        if(!err && value != null) {
                            userData.username = "Anonymous"+value;
                            callback(null, userData.username);
                            next();
                        }
                    });
                },
                function saveUserInfo() {
                    socket.set('userinfo', userData, this);
                },
                function addUser() {
                    redisClient.sadd(roomid+' users', userData.username, this);
                },
                function sendMessagesAndUsers() {
                    var messageCallback = this.parallel();
                    var userCallback = this.parallel();
                    Message.allFrom(roomid, 1, function(err, messages) {
                        if(!err && messages) {
                            socket.emit('new messages', messages);
                        }
                        messageCallback();
                    });
                    redisClient.smembers(roomid+" users", function(err, users) {
                        socket.emit('users', users);
                        userCallback();
                    });
                },
                function announceUser() {
                    socket.join(roomid);
                    socket.broadcast.to(roomid).json.emit('user joined', userData.username);
                    socket.emit('ready');
                }
            );
        });

        socket.on('message', function(data) {
            if(!data || data.length > MAX_MSG_LEN) {
                return;
            }
            socket.get('userinfo', function (err, userinfo) {
                if(err || !userinfo) return;
                var username = userinfo.username;
                var roomid = userinfo.roomid;
                var message = new Message({
                    roomid: roomid,
                    username: username,
                    body: data,
                    userip: socket.handshake.address
                });
                message.save(function(err) {
                    if(err) console.log(err);
                    socket.broadcast.to(roomid).json.emit('new message', message.publicFields());
                });
            });
        });

        socket.on('username change', function(data, callback) {
            if(!data || data.length > MAX_USR_LEN) {
                callback('roomid invalid');
                return;
            }
            var newname = data;
            socket.get('userinfo', function (err, userinfo) {
                if(err || !userinfo) {
                    callback('user not found');
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
                        var next = this;
                        userinfo.username = newname;
                        socket.set('userinfo', userinfo, function (err) {
                            if(err) callback(err);
                            else next();
                        });
                    },
                    function notifyUsernameChange() {
                        var renameObj = {oldname: oldname, newname: newname};
                        socket.broadcast.to(userinfo.roomid).json.emit('user renamed', renameObj);
                        callback(null, newname);
                    }
                );
                
            });
        });
        
        socket.on('disconnect', function () {
            socket.get('userinfo', function (err, userinfo) {
                if(err || !userinfo) return;
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


