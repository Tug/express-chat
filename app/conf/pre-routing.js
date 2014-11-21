
module.exports = function(app, model, callback) {

    // req middlewares
    app.middleware("limit", '100kb');
    app.middleware("json");
    app.middleware("urlencoded");
    app.cookieParser = app.middleware("cookieParser");
    app.session = app.middleware("session");
    // app.sessionStore is loaded from `autoload`

    // res middlewares
    app.middleware("static");
    app.middleware("favicon");

    // give access to the various objects in the views
    app.express.use(function(req, res, next) {
        res.locals.routes = app.routes;
        res.locals.config = app.config;
        res.locals.libs = app.libs;
        next();
    });

    // other configuration modules
    app.libs.Step(function() {
        var group = this.group();

        require("./io")(app, model, group());

    }, callback);


};
