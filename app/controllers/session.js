
module.exports = function(app, model) {

    var actions = {};

    actions.load = function(req, res, next) {
        if(req.session && req.session.id == req.sessionID) {
            req.session.reload(next).touch();
        } else {
            console.log("loading session : "+req.sessionID);
            req.sessionStore.load(req.sessionID, function(err, session) {
                req.session = session;
                next(err);
            });
        }
    };

    return actions;
};
