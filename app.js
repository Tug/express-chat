
var fs          = require('fs')
  , debug       = require('debug')('express-chat')
  , configFile  = process.argv.slice(2)[0] || './config.json'
  , userconfig  = JSON.parse(fs.readFileSync(configFile, 'utf8'))
  , config      = require('./config')(userconfig)
  , setup       = require('./lib/setup');

debug('Starting application...');

setup.createApplication(config, function(err, app) {
    
    if(err) {
        console.log(err.stack || err);
        return;
    }
    
    app.server.listen(config.port, config.hostname, function() {
        console.log('Server started on port %s in %s mode',
                    app.server.address().port,
                    app.express.settings.env);
    });
    
});

