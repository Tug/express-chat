
module.exports = function(app, model, callback) {

    app.middleware(app.controllers.error.serverError);

    callback();

};
