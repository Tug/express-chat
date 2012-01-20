
exports.autoload = function(app) {
  var io = require('socket.io');
  var sockets = io.listen(app).sockets;
  app.socket = function(eventName, middlewares, func) {
    // UNTESTED
    if(!func) {
      func = middlewares;
    } else if(middlewares && middlewares.length) {
      while(middlewares.length > 0) {
        var middleware = middlewares.shift()
        func = function() { middleware(func) };
      }
    }
    sockets.on(eventName, func);
  }
};
