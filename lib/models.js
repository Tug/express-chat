
module.exports.autoload = function(app, model, modelsPath){
    var fs = require("fs"),
        path = require("path"),
        files = [];
    
    try {
      files = fs.readdirSync(modelsPath);
    } catch(err) {}

    var names = files.map(function(f) {
        return path.basename(f).replace(/.js$/,'');
    });
    
    var models = {};
    names.forEach(function(modelName){
        models[modelName] = require(path.join(modelsPath, modelName))(app, model);
    });

    return models;
};
