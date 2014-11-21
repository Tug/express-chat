
module.exports = function(app, model, directories) {
    var fs          = require("fs")
      , path        = require("path")
      , util        = require("./util")
      , directories = (typeof directories === "string") ? [ directories ] : (directories || []);

    function isPathAbsolute(testPath) {
        return path.resolve(testPath)===testPath;
    }

    var files = util.flattenArray(directories.map(function(dir) {
        if(!isPathAbsolute(dir)) {
            dir = path.join(app.config.application_root, dir);
        }
        if(!fs.existsSync(dir)) return [];
        return fs.readdirSync(dir).map(function(filename){
            return path.join(dir, filename);
        });
    }));
    
    var objects = {};

    files.forEach(function(f) {
        var name = path.basename(f).replace(/.js$/,'');
        objects[name] = require(f)(app, model);
    });
    
    return objects;
};
