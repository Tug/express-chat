
var args        = process.argv.splice(2)
  , configFile  = args[0] || './config.json'
  , fs          = require('fs')
  , userconfig  = JSON.parse(fs.readFileSync(configFile, 'utf8'))
  , config      = require('../config')(userconfig)
  , autoload    = require('express-autoload');

function dropCollections(db) {
    db.collectionNames(function(err, names) {
        if(err || !names) {
            console.log("No collection found");
            process.exit(0);
        } else {
            names = names.map(function(colObj) { return colObj.name.split('.').splice(1).join('.'); });
            app.libs.Step(function() {
                var group = this.group();
                var groups = {};
                names.forEach(function(name) {
                    if(name.indexOf("system") != 0) {
                        groups[name] = group();
                        db.collection(name, function(err, collection) {
                            console.log("Removing all objects in "+collection.collectionName);
                            collection.remove({}, groups[collection.collectionName]);
                        });
                    }
                });
            }, function() {
                process.exit(0);
            });
        }
    });
}

var model = {}
  , app = {};
autoload(app, model, config, function() {
    var db = model.mongo;
    if(model.mongoose.readyState == 1) {
        dropCollections(db);
    } else {
        model.mongoose.on('open', function() {
            dropCollections(db);
        });
    }
});

