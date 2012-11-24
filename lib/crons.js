
module.exports.autoload = function(app, model, cronsPath) {
    var fs = require("fs"),
        path = require("path"),
        files = [];
    
    try {
      files = fs.readdirSync(cronsPath);
    } catch(err) {}

    var names = files.map(function(f) {
        return path.basename(f).replace(/.js$/,'');
    });

    var crons = {};
    names.forEach(function(cronName){
        crons[cronName] = require(path.join(cronsPath, cronName))(app, model);
    });

    return crons;
};
