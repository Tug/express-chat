var _ = require("underscore");

module.exports.autoload = function(app, model, cronsPath) {
    var fs = require("fs"),
        path = require("path"),
        files = fs.readdirSync(cronsPath),
        names = _.map(files,function(f) {
            return path.basename(f).replace(/.js$/,'');
        });

    var crons = {};
    _.each(names, function(cronName){
        crons[cronName] = require(path.join(cronsPath, cronName))(app, model);
    });

    return crons;
};
