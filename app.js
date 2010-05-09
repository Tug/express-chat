GLOBAL.DEBUG = true;
require.paths.unshift(__dirname + "/vendor/express/lib");
require("express");
require("express/plugins");

var sys   = require("sys");
var User  = require("./util/user").User;
var util  = require("./util/util");
var Room  = require("./room").Room;
var MyDB  = require("./mongo/mydb").MyDB;

/*
 * Read configuration
 */
var fs = require("fs");
var yaml = require("./vendor/js-yaml/lib/yaml");﻿
var configuration = yaml.eval(fs.readFileSync("config.yml"));
sys.p(configuration);

var host = configuration.host;
var port = configuration.port;
if(process.argv.length > 2) port = parseInt(process.argv[2]);
var serverID = host + ":" + port;

process.env["MONGO_NODE_DRIVER_HOST"] = configuration.mongo.host;
process.env["MONGO_NODE_DRIVER_PORT"] = configuration.mongo.port;

/*
 * Create local objects
 */
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
  use(MethodOverride)
  use(ContentLength)
  use(Cookie)
  use(Cache, { lifetime: (5).minutes, reapInterval: (1).minute })
  use(Session, { lifetime: (2).days, reapInterval: (1).hour })
  use(Static)
  set("root", __dirname)
  set('max upload size', (200).megabytes)
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
          self.respond(200, JSON.encode({error: err.message}));
        } else {
          self.session.user.name = newname;
          self.respond(200);
        }
      });
    }
    if(message) {
      room.announceUserMessage(user.name, message);
    }
  }
  this.respond(200);
});

/*
 * Send back new messages.
 */
get("/room/:roomID/live/msg/:lastMsgId", function(roomID, lastMsgId){
  if(this.session.user == null || !rooms[roomID]) {
    this.respond(200);
    return;
  }
  var self = this;
  rooms[roomID].addMessageListener(lastMsgId, this.session, function(err, data) {
    var messages = data || [];
    self.contentType("json");
    self.respond(200, JSON.encode({messages: messages}));
  });
});

/*
 * Send back new users.
 */
get("/room/:roomID/live/users", function(roomID){
  if(this.session.user == null || !rooms[roomID]) {
    this.respond(200);
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
    self.respond(200, JSON.encode({"newusers": newusers, "usersleft": usersleft}));
  });
});

get("/room/:roomID/users", function(roomID){
  if(this.session.user == null || !rooms[roomID]) {
    this.respond(200);
    return;
  }
  var self = this;
  var users = rooms[roomID].getUsers(function(err, users) {
    self.contentType("json");
    self.respond(200, JSON.encode(users));
  });

});

get("/room/:roomID/part", function(roomID){
  if(this.session.user == null || !rooms[roomID]) {
    this.respond(200);
    return;
  }
  rooms[roomID].announceUserLeft(this.session.user.name);
  this.session.alive = false;
  this.respond(200);
});

get("/room/:roomID/keepalive", function(roomID){
  this.respond(200);
});

post("/room/:roomID/upload", function(){
  if(this.session.user == null || !rooms[roomID]) {
    this.respond(200);
    return;
  }
  this.param('files').each(function(file) {
    fs.stat(file.tempfile, function (err, stats) {
      file.merge(stats);
      file.uploader = this.session.user.name;
      var words = file.tempfile.split("-");
      file.id = words[words.length-1];
      var usefulInfo = util.array_intersect_key_value(file, ["filename", "id", "size", "ctime"]);
      rooms[roomID].announceFile(usefulInfo);
    });
  }, this)
  this.redirect('/upload')
});

get("/*.css", function(file){
  this.render(file + ".css.sass", { layout: false });
});

get('/favicon.ico', function(){
  this.respond();
});

/*
 * Send file.
 */
get("/room/:roomID/files/:fileId", function(fileId){
  if(this.session.user == null || !rooms[roomID]) {
    this.respond(200);
    return;
  }
  var self = this;
  
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

