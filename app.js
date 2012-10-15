var fs = require('fs');
var userconfig = JSON.parse(fs.readFileSync("./config.json", "utf8"));
var config = require('./config')(userconfig);

var setup = require("./lib/setup");

setup.createApplication(config, function(err, app) {
    
    if(err) console.log(err);
    
    app.server.listen(config.port);
    
    console.log('Express server started on port %s', app.server.address().port);
    
});

