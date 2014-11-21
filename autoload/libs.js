
module.exports.autoload = function(libs, pathList) {
    var fs        = require("fs")
      , path      = require("path")
      , util      = require("./util")
      , pathList  = (typeof pathList === "string") ? [ pathList ] : (pathList || []);

    var files = util.flattenArray(pathList.map(function(filePath) {
        var stats = fs.statSync(filePath);
        if(stats.isFile()) {
            return [ filePath ];
        } else if(stats.isDirectory()) {
            return fs.readdirSync(filePath).map(function(filename){
                return path.join(filePath, filename);
            });
        }
    }));

    files.forEach(function(f) {
        var name = path.basename(f).replace(/.js$/,'');
        libs[name] = require(f);
    });

    return libs;

};
