
var args = process.argv.splice(2);
if(args.length == 0) {
    console.log("Enter room name as argument");
    process.exit(0);
}

var roomTitle = args[0];

var fs = require('fs');
var configGen = require('../config');
var userconfig = JSON.parse(fs.readFileSync(application_root+"/config.json", "utf8"));
var config = configGen(userconfig);
var setup = require(application_root+"/lib/setup");

setup.createApplication(config, function(err, app, model) {
    
    if(err) console.log(err);
    
    var Room = model.mongoose.model('Room');
    var room = new Room({_id: roomTitle, ispublic: false, title: roomTitle});

    model.mongoose.connections[0].on("open", function() {
        room.save(function(err) {
            if(err) {
                console.log(err.message);
            } else {
                var url = app.routes.url("chat.index", {"roomid": room.id });
                console.log("room created at "+url);
            }
            process.exit(0);
        });
    });
    
});

