GLOBAL.DEBUG = true;
require.paths.unshift("../express/lib");
require("express");
require("express/plugins");

var sys   = require("sys");
var User  = require("./util/user").User;
var Room  = require("./room").Room;
var test  = require("mjsunit");
var MyDB  = require("./mongo/mydb").MyDB;

var host = "localhost";
var port = 3000;

if(process.argv.length > 2) port = parseInt(process.argv[2]);
var serverID = host + ":" + port;

var rooms = {};
var db = new MyDB();

/*
 * Init the database
 */
var init = function(callback) {
  db.connect(function(err, db) {
    db.createRooms(callback);
  });
};

/*
 * configure express
 */
configure(function(){
  use(Logger)
  use(MethodOverride)
  use(ContentLength)
  use(Cookie)
  use(Cache, { lifetime: (5).minutes, reapInterval: (1).minute })
  use(Session, { lifetime: (2).days, reapInterval: (1).hour })
  use(Static)
  set("root", __dirname)
});

/*
 * Send the home page.
 */
get("/", function() {
  this.render("home.html.haml", {
    locals : {
      formAction: "/"
    }
  });
});

/*
 * Create a new chat room.
 */
post("/", function(){
  var name = this.param("name");
  if( !name ) {
    this.redirect('/');
    return;
  }
  this.session.user = new User(name);
  var room = new Room(name);
  rooms[room.id] = room;
  if(true)
    room.save(db, serverID);
  this.redirect('/room/'+room.id);
});

/*
 * Send the chat room page.
 */
get("/room/:roomID", function(roomID){
  var room = rooms[roomID] || null;
  var self = this;
  if(room == null) {
    db.rooms.get(roomID, function(err, dbroom) {
      var addrRedir = (dbroom) ? ("http://"+dbroom.server+"/room/"+roomID) : ("/");
      self.redirect( addrRedir );
      return;
    });
  } else {
    var renderChat = function(username) {
      self.render("chat.html.haml", {
        locals: {
          roomID: roomID,
          title: "Chat+ - "+roomID,
          username: username
        },
        layout: false
      });
    };
    if(this.session.user != null) {
      renderChat(this.session.user.name);
    } else {
      var username = room.createUsername();
      this.session.user = new User(username);
      renderChat(username);
    }
    if(!this.session.alive) {
      room.announceUser(this.session.user.name);
      this.session.alive = true;
    }
  }
});

/*
 * Receive new messages.
 */
post("/room/:roomID/live", function(roomID){
  var newname = this.param("name") || null;
  var message = this.param("message") || null;
  var user = this.session.user || null;
  var room = rooms[roomID] || null;
  if(user && room) {
    if(newname) {
      var self = this;
      room.changeUserName(user.name, newname, function(err, newuser) {
        if(err) {
          self.contentType("json");
          self.halt(200, JSON.encode({error: err.message}));
        } else {
          self.session.user.name = newname;
          self.halt(200);
        }
      });
    }
    if(message) {
      room.announceUserMessage(user.name, message);
    }
  }
  this.halt(200);
});

/*
 * Send back new messages.
 */
get("/room/:roomID/live/msg/:lastMsgId", function(roomID, lastMsgId){
  if(this.session.user == null || !rooms[roomID]) {
    this.halt(200);
    return;
  }
  var self = this;
  rooms[roomID].addMessageListener(lastMsgId, this.session, function(err, data) {
    var messages = data || [];
    self.contentType("json");
    self.halt(200, JSON.encode({messages: messages}));
  });
});

/*
 * Send back new users.
 */
get("/room/:roomID/live/users", function(roomID){
  if(this.session.user == null || !rooms[roomID]) {
    this.halt(200);
    return;
  }
  var self = this;
  rooms[roomID].addUserListener(this.session, function(err, data) {
    var newusers = data.added || [];
    var usersleft = data.removed || [];
    var modifiedusers = data.modified || [];
    for(var i=0; i<modifiedusers.length; i++)
        (i % 2 == 0) ? (usersleft.push(modifiedusers[i]))
                      : (newusers.push(modifiedusers[i]));
    self.contentType("json");
    self.halt(200, JSON.encode({"newusers": newusers, "usersleft": usersleft}));
  });
});

get("/room/:roomID/users", function(roomID){
  if(this.session.user == null || !rooms[roomID]) {
    this.halt(200);
    return;
  }
  var self = this;
  var users = rooms[roomID].getUsers(function(err, users) {
    self.contentType("json");
    self.halt(200, JSON.encode(users));
  });

});

get("/room/:roomID/part", function(roomID){
  if(this.session.user == null || !rooms[roomID]) {
    this.halt(200);
    return;
  }
  rooms[roomID].announceUserLeft(this.session.user.name);
  this.session.alive = false;
  this.halt(200);
});

get("/room/:roomID/keepalive", function(roomID){
  this.halt(200);
});
/*
setInterval(function() {
  var maxDelay = (1).minute;
  var sessions = Session.store.store.values;
  //sys.puts(JSON.stringify(sessions));
  var now = Date.now();
  for(var session in sessions) {
    if(now - session.lastAccess > maxDelay)
      session.alive = false;
  }
}, 10*1000);
*/
get("/*.css", function(file){
  this.render(file + ".css.sass", { layout: false });
});

get('/favicon.ico', function(){
  this.halt();
});

sys.puts("Init...");
// synchronous init to avoid running the whole app in the try catch of the connection
var initEnded = false;
init(function() {
  initEnded = true;
});

var runTimer = setInterval(function() {
  if(initEnded) {
    sys.puts("Running server now...");
    clearInterval(runTimer);
    run(port, host);
  }
}, 100);

