
var cloudfoundry = require('cloudfoundry');
if(!cloudfoundry.isRunningInCloud()){
    console.log("not running in cloud");
    process.exit(0);
}

var mongo = cloudfoundry.getServiceConfig('mongodb');
var redis = cloudfoundry.getServiceConfig('redis');
var port  = cloudfoundry.getAppPort();

var config = require('./config')({
    port : port,
    database : {
        mongodb: mongo,
        redis: redis
    }
});

var setup = require("./lib/setup");

setup.createApplication(config, function(err, app) {
    
    if(err) console.log(err);
    
    app.listen(config.port);
    
    console.log('Express server started on port %s', app.address().port);
    
});

