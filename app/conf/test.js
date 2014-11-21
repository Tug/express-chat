
module.exports = function(app, model, callback) {

    app.middleware("errorHandler", { dumpExceptions: true, showStack: true });
    callback();

};
