
var userconfig = require('../loadConfig');

require('../loadApp')(userconfig, function(err, app, model, config) {

    var Step = app.libs.Step;
    var db = model.mongo;

    dropCollections(db);

    function dropCollections(db) {
        db.collectionNames(function(err, names) {
            if(err || !names) {
                console.log("No collection found");
                process.exit(0);
            } else {
                console.log("Removing collections", names);
                names = names.map(function(colObj) { return colObj.name.split('.').splice(1).join('.'); });
                Step(function() {
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

});

