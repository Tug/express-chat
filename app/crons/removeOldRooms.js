
module.exports = function(app, model) {

    var Room = model.mongoose.model('Room');
    
    setInterval(function() {
        Room
        .where('deathDate').lt(new Date())
        .exec(function(err, rooms) {
            if(!err && rooms) {
                var count = rooms.length;
                rooms.forEach(function(room) {
                    room.remove();
                });
                if(count > 0) console.log(count+" room(s) cleaned !");
            }
        });
        
    }, 1 * 60 * 1000);
    
};


