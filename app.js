
var fs      = require('fs');
var path    = require('path');
var debug   = require('debug')('nirror');
var userconfig = require('./loadConfig');

require('./loadApp')(userconfig, function(err, app, model, config) {
    if(err) {
        console.log(err.stack || err);
        return;
    }
    console.log('Server started on port %s in %s mode',
        app.server.address().port,
        app.express.settings.env);
});
