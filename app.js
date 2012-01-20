
var config = require('./config');
var setup = require("./lib/setup");

setup.createApplication(config, function(err, app) {
    
    if(err) console.log(err);
    
    app.listen(config.port);
    
    console.log('Express server started on port %s', app.address().port);
    
});

