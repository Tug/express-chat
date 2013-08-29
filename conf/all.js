
module.exports = function(app, model) {


    app.express.use(app.libs.express.limit('100kb'));

    app.config.HOST = "http://"+app.config.hostname+((app.config.port!=80)?(":"+app.config.port):"");

    app.Plates = require('express3-plates').plates;

    // give access to the various objects in the views
    app.express.use(function(req, res, next) {
        res.locals.routes = app.routes;
        res.locals.config = app.config;
        res.locals.libs = app.libs;
        next();
    });

};
