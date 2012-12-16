
var args = process.argv.splice(2);
if(args.length < 2) {
    console.log("Enter config file and room name as arguments");
    process.exit(0);
}

var configFile  = args[0]
  , roomTitle   = args[1]
  , fs          = require('fs')
  , userconfig  = JSON.parse(fs.readFileSync(configFile, 'utf8'))
  , config      = require('../config')(userconfig)
  , autoload    = require('express-autoload');

var model = {}
  , app = {};
autoload(app, model, config, function(err) {

    if(err) console.log(err);
    
    var Room = model.mongoose.model('Room');
    var room = new Room({_id: roomTitle, ispublic: false, title: roomTitle});
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

