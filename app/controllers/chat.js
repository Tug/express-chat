
module.exports = function(app, model) {

    var Room = model.mongoose.model('Room'),
        Message = model.mongoose.model('Message'),
        Counter = model.mongoose.model('Counter');
        Step = app.libs.step;
    
    var redis = model.redis;
    var redisClient = redis.createClient();
    var anonCounter = new Counter({_id: "Anon"});

    var actions = {};
    
    actions.create = function(req, res, next) {
        var room = new Room();
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
        
        socket.on('join room', function(data) {
            if(!data || !data.username || !data.roomid) {
                socket.emit('error', 'data invalid');
                console.log('error', 'data invalid');
                return;
            }
            console.log('join room', 'data', data);
            var username = data.username;
            var roomid = data.roomid;
            var secureData = {
                username: username,
                roomid: roomid
            };
            Step(
                function saveUserInfo() {
                    socket.set('userinfo', secureData, this);
                },
                function addUser() {
                    redisClient.sadd(roomid+' users', username, this);
                },
                function sendMessagesAndUsers() {
                    var messageCallback = this.parallel();
                    var userCallback = this.parallel();
                    Message.allFrom(roomid, 1, function(err, messages) {
                        console.log('sending msg', messages);
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
                    socket.broadcast.to(roomid).json.emit('user joined', username);
                    socket.emit('ready');
                }
            );
        });

        socket.on('message', function(data) {
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
            var newname = data;
            socket.get('userinfo', function (err, userinfo) {
                if(err || !userinfo) return;
                var oldname = userinfo.username;
                var roomid = userinfo.roomid;
                userinfo.username = newname;
                socket.set('userinfo', userinfo, function (err) {
                    redisClient.srem(roomid+' users', oldname, function() {
                        redisClient.sadd(roomid+' users', newname, function() {
                            var renameObj = {oldname: oldname, newname: newname};
                            console.log('user renamed', renameObj);
                            socket.broadcast.to(roomid).json.emit('user renamed', renameObj);
                            callback(null, newname);
                        });
                    });
                });
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


