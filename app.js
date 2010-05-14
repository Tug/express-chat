/*
 * Read configuration
 */
var configuration = require("./config").configuration;
for(var key in configuration.globals) { global[key] = configuration.globals[key]; }

require.paths.unshift( DIR_VENDORS + "/express/lib");
require("express");
require("express/plugins");

var sys   = require("sys");
var fs    = require("fs");
var util  = require(PATH_UTIL);
var MyDB  = require(DIR_MONGO + "/mydb").MyDB;
var Room  = require("./room").Room;

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
configure("development", function(){
  use(MethodOverride)
  use(ContentLength)
  use(Cookie)
  use(Cache, { lifetime: (5).minutes, reapInterval: (1).minute })
  use(Session, { lifetime: (2).days, reapInterval: (1).minute })
  use(Static)
  use(Logger)
  set("root", __dirname)
  set('max upload size', (200).megabytes)
});

/*
 * Send the home page.
 */
get("/", function() {
  this.render("home.html.haml", {
    locals : {
      formAction: "/",
      title: "Chat+"
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
  var usedb = true; //this.param("usedb");
  var room = new Room(name);
  rooms[room.id] = room;
  this.session[room.id] = { username: name, alive: false };
  if(usedb == true)
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
      if(err) sys.puts("Error: "+err.message);
      var addrRedir = "/";
      if(dbroom != null) {
        if(dbroom.server == serverID) {
          rooms[dbroom.roomID] = Room.createRoomFromDb(db, dbroom, true);
        }
        addrRedir = "http://"+dbroom.server+"/room/"+roomID;
      }
      self.redirect(addrRedir);
      return;
    });
  } else {
    if(this.session[roomID] == null) {
      var name = room.createUsername();
      this.session[roomID] = { username: name, alive: false };
    }
    if(this.session[roomID].alive == false) {
      room.announceUser(this.session[roomID].username);
      this.session[roomID].alive = true;
    }
    this.render("chat.html.haml", {
      locals: {
        roomID: roomID,
        title: "Chat+ - "+roomID,
        username: this.session[roomID].username
      }
    });
  }
});

/*
 * Receive new messages.
 */
post("/room/:roomID/live", function(roomID){
  var newname = this.param("name") || null;
  var message = this.param("message") || null;
  var roomsession = this.session[roomID] || null;
  var room = rooms[roomID] || null;
  if(roomsession != null && roomsession.username != null && room != null) {
    if(newname) {
      var self = this;
      room.changeUserName(roomsession.username, newname, function(err, newname) {
        if(err) {
          self.contentType("json");
          self.respond(200, JSON.encode({error: err.message}));
        } else {
          self.session[roomID].username = newname;
          self.respond(200);
        }
      });
    }
    if(message) {
      room.announceUserMessage(roomsession.username, message);
    }
  }
  this.respond(200);
});

/*
 * Send back new messages.
 */
get("/room/:roomID/live/msg/:lastMsgId", function(roomID, lastMsgId){
  if(!this.session[roomID] || !rooms[roomID]) {
    this.respond(200);
    return;
  }
  var self = this;
  rooms[roomID].addMessageListener(lastMsgId, this.session, function(err, data) {
    if(err) sys.puts("Error: "+err.message);
    var messages = data || [];
    self.contentType("json");
    self.respond(200, JSON.encode({messages: messages}));
  });
});

/*
 * Send back new users.
 */
get("/room/:roomID/live/users", function(roomID){
  if(!this.session[roomID] || !rooms[roomID]) {
    this.respond(200);
    return;
  }
  var self = this;
  rooms[roomID].addUserListener(this.session, function(err, data) {
    if(err) sys.puts("Error: "+err.message);
    var newusers = data.added || [];
    var usersleft = data.removed || [];
    var modifiedusers = data.modified || [];
    for(var i=0; i<modifiedusers.length; i++) {
      usersleft.push(modifiedusers[i][0]);
      newusers.push(modifiedusers[i][1]);
    }
    self.contentType("json");
    self.respond(200, JSON.encode({"newusers": newusers, "usersleft": usersleft}));
  });
});

get("/room/:roomID/users", function(roomID){
  if(!this.session[roomID] || !rooms[roomID]) {
    this.respond(200);
    return;
  }
  var self = this;
  var users = rooms[roomID].getUsers(function(err, users) {
    if(err) sys.puts("Error: "+err.message);
    self.contentType("json");
    self.respond(200, JSON.encode(users));
  });

});

get("/room/:roomID/part", function(roomID){
  if(!this.session[roomID] || !rooms[roomID]) {
    this.respond(200);
    return;
  }
  rooms[roomID].announceUserLeft(this.session[roomID].username);
  delete this.session[roomID];
  this.respond(200);
});

get("/room/:roomID/keepalive", function(roomID){
  this.respond(200);
});

post("/room/:roomID/upload", function(roomID){
  if(!this.session[roomID] || !rooms[roomID]) {
    this.respond(200);
    return;
  }
  var file = this.param("file");
  var self = this;
  fs.stat(file.tempfile, function (err, stats) {
    Object.merge(file, stats);
    file.uploader = self.session.user.name;
    var words = file.tempfile.split("-");
    file.id = words[words.length-1];
    var usefulInfo = util.array_intersect_key_value(file, ["filename", "id", "size", "ctime"]);
    rooms[roomID].announceFile(self.session[roomID].username, usefulInfo);
    self.respond(200);
  });
});

get("/:cssname.css", function(file){
  this.render(file + ".css.sass", { layout: false });
});

get('/favicon.ico', function(){
  this.respond();
});

/*
 * Send file.
 */
get("/room/:roomID/files/:fileId", function(fileId){
  if(!this.session[roomID] || !rooms[roomID]) {
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

