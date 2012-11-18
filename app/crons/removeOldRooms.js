
var mongoose = require('mongoose');


module.exports = function(app, model) {

    var Room = mongoose.model('Room');
    var life = 2 * 24 * 60 * 60 * 1000;

    setInterval(function() {
        Room
        .where('creationDate').lt(new Date(Date.now()-life))
        .exec(function(err, rooms) {
            if(!err && rooms) {
                var count = rooms.length;
                rooms.forEach(function(room) {
                    room.remove();
                });
                if(count > 0) console.log(count+" room(s) cleaned !");
            }
        });
        
    }, 10 * 60 * 1000);
    
};


