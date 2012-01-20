
module.exports = function(app, model) {

    var actions = {};
    
    actions.index = function(req, res, next) {
        res.render('home.html');
    };
    
    return actions;

}

