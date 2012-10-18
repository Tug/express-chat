
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
        var ispublic = !!req.body.ispublic;
        var title = req.body.title || null;
        if(title !== null && (typeof title !== 'string' || title.length > 100)) {
            next(new Error("wrong input name"));
            return;
        }
        var room = new Room({ispublic: ispublic, title: title});
        room.save(function(err) {
            if(err) {
                console.log(err);
                next(err);
            } else {
                res.redirect(app.routes.url("chat.index", {"roomid": room.id }));
            }
        });
    };
    
    return actions;

}

