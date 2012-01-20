var _ = require("underscore");

module.exports.autoload = function(app, model, modelsPath){
    var fs = require("fs"),
        path = require("path"),
        files = fs.readdirSync(modelsPath),
        names = _.map(files,function(f) {
            return path.basename(f).replace(/.js$/,'');
        });
    
    var models = {};
    _.each(names, function(modelName){
        models[modelName] = require(path.join(modelsPath, modelName))(app, model);
    });

    return models;
};
