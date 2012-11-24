
module.exports.autoload = function(libsPath){
    var fs    = require("fs")
      , path  = require("path")
      , files = fs.readdirSync(libsPath)
      , names = files.map(function(f) {
            return path.basename(f).replace(/.js$/,'');
        });
    
    var libs = {};
    
    names.forEach(function(libName) {
        libs[libName] = require(path.join(libsPath, libName));
    });
  
    return libs;

};
