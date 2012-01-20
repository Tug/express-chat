var _ = require("underscore");

module.exports.autoload = function(libsPath){
    var fs = require("fs"),
        path = require("path"),
        files = fs.readdirSync(libsPath),
        names = _.map(files, function(f) {
            return path.basename(f).replace(/.js$/,'');
        });
    
    var libs = {};
    
    _.each(names, function(libName) {
        libs[libName] = require(path.join(libsPath, libName));
    });
  
    return libs;

};
