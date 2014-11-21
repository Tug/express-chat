
module.exports = function(app, model) {

    var actions = {};
    var env = app.config.settings.env;
    var debug = (app.config.settings.debug)
        ? console.log
        : require('debug')('controllers:error');

    actions.notFound = function(req, res) {
        res.send(400, "Invalid request URI");
    };

    actions.notAuthenticated = function(req, res) {
        res.send(400, "Bad Authentication data");
    };

    actions.serverError = function(err, req, res, next) {
        if (err.status) res.statusCode = err.status;
        if (res.statusCode < 400) res.statusCode = 500;
        debug(((err && debug) ? err.stack : err.message) || err);
        var accept = req.headers.accept || '';
        // html
        if (~accept.indexOf('html')) {
            res.render("error/500", { error: err });
            // json
        } else if (~accept.indexOf('json')) {
            var json = JSON.stringify({ error: err.message });
            res.setHeader('Content-Type', 'application/json');
            res.end(json);
            // plain text
        } else {
            res.writeHead(res.statusCode, { 'Content-Type': 'text/plain' });
            res.end(err.message);
        }
    };

    return actions;

}

