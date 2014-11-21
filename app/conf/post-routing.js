
module.exports = function(app, model, callback) {

    require("./"+app.config.settings.env)(app, model, callback);

};
