
var fs      = require('fs');
var path    = require('path');
var debug   = require('debug')('express-chat');

var args = process.argv.slice(2);
var configFile = args.shift();
if(!configFile || !/\.json$/.test(configFile)) {
    var env = process.env.NODE_ENV;
    switch(env) {
        case "production":
            configFile = "production.json";
            break;
        case "test":
            configFile = "test.json";
            break;
        case "development":
        default:
            configFile = "config.json";
    }
}
var userconfig  = JSON.parse(fs.readFileSync(path.join(__dirname, configFile), 'utf8'));

module.exports = userconfig;
