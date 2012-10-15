
module.exports = function(app, model) {

    var Room = model.mongoose.model('Room');
    
    var actions = {};
    
    actions.index = function(req, res, next) {
        var query = Room.find()
                        .where('ispublic').equals(true)
                        .limit(100);
        query.exec(function(err, docs) {
            var rooms = [];
            docs.forEach(function(room) { rooms.push(room.publicFields()); });
            res.render('home', {rooms: rooms});
        });
    };
    
    actions.createRoom = function(req, res, next) {
        var ispublic = req.body.ispublic || false;
        var title = req.body.title || null;
        var room = new Room({ispublic: ispublic, title: title});
        room.save(function(err) {
            if(err) {
                console.log(err);
                next(err);
            } else {
                res.redirect(app.url("chat.index", {"roomid": room.id }));
            }
        });
    };
    
    return actions;

}

