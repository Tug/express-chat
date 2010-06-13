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
var dirname = require(PATH_PHPJS).dirname;

var host = configuration.host;
var port = configuration.port;
if(process.argv.length > 2)
  port = parseInt(process.argv[2]);
var serverID = configuration.myip + ":" + port;
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
  use(Session, { lifetime: (2).days, reapInterval: (1).minute })
  use(Static)
  set("root", __dirname)
});

configure("development", function(){
  use(Logger)
  set('max upload size', (500).megabytes)
});

configure("production", function(){
  set('max upload size', (50).megabytes)
});

/*
 * Send the home page.
 */
get("/", function() {
  var self = this;
  db.rooms.getPublicRooms(function(err, publicrooms) {
    if(isset(err)) sys.puts(err.message);
    else {
      self.render("home.html.haml", {
        locals : {
          formAction: "/",
          title: "Chat+",
          publicrooms: publicrooms
        }
      });
    }
  });

});

/*
 * Create a new chat room.
 */
post("/", function(){
  var name = this.param("name");
  //var roomID = this.param("roomID");
  if(!isset(name)) {
    this.redirect('/');
    return;
  }
  var usedb = true; //this.param("usedb");
  var ispublic = (this.param("ispublic")) ? true : false;
  if(name.length > MAX_USR_LEN)
    name = name.substring(0, MAX_USR_LEN)
  var room = new Room({"admin": name});//, "id": roomID});
  rooms[room.id] = room;
  this.session[room.id] = { username: name, alive: false };
  if(usedb == true)
    room.save(db, serverID, ispublic);
  this.redirect('/room/'+room.id);
});


/*
 * Send the chat room page.
 */
get("/room/:roomID", function(roomID){
  var room = rooms[roomID] || null;
  var self = this;
  if(!isset(room)) {
    db.rooms.get(roomID, function(err, dbroom) {
      if(isset(err)) {
        sys.puts("Error: "+err.message);
        self.error();
        return;
      }
      var addrRedir = "/";
      if(isset(dbroom)) {
        if(dbroom.server == serverID) {
          rooms[dbroom.roomID] = Room.createRoomFromDb(db, dbroom, true);
        }
        addrRedir = "http://"+dbroom.server+"/room/"+roomID;
      }
      self.redirect(addrRedir);
      return;
    });
  } else {
    if(!isset(this.session[roomID])) {
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
  if(isset(roomsession) && isset(roomsession.username, room)) {
    if(isset(newname)) {
      if(newname.length > MAX_USR_LEN)
        newname = newname.substring(0, MAX_USR_LEN)
      var self = this;
      room.changeUserName(roomsession.username, newname, function(err, newname) {
        if(isset(err)) {
          self.contentType("json");
          self.respond(200, JSON.encode({error: err.message}));
        } else {
          self.session[roomID].username = newname;
          self.respond(200);
        }
      });
    }
    if(isset(message)) {
      if(message.length > MAX_MSG_LEN)
        message = message.substring(0, MAX_MSG_LEN)
      room.announceUserMessage(roomsession.username, message);
    }
  }
  this.respond(200);
});

/*
 * Send back new messages.
 */
get("/room/:roomID/live/msg/:lastMsgId", function(roomID, lastMsgId){
  if(!isset(this.session[roomID], rooms[roomID])) {
    this.error();
    return;
  }
  var self = this;
  rooms[roomID].addMessageListener(lastMsgId, this.session, function(err, data) {
    if(isset(err)) sys.puts("Error: "+err.message);
    var messages = data || [];
    self.contentType("json");
    self.respond(200, JSON.encode({messages: messages}));
  });
});

/*
 * Send back new users.
 */
get("/room/:roomID/live/users", function(roomID){
  if(!isset(this.session[roomID], rooms[roomID])) {
    this.error();
    return;
  }
  var self = this;
  rooms[roomID].addUserListener(this.session, function(err, data) {
    if(isset(err)) sys.puts("Error: "+err.message);
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
  if(!isset(this.session[roomID], rooms[roomID])) {
    this.error();
    return;
  }
  var self = this;
  var users = rooms[roomID].getUsers(function(err, users) {
    if(isset(err)) sys.puts("Error: "+err.message);
    self.contentType("json");
    self.respond(200, JSON.encode(users));
  });
});

get("/room/:roomID/part", function(roomID){
  if(!isset(this.session[roomID], rooms[roomID])) {
    this.error();
    return;
  }
  rooms[roomID].announceUserLeft(this.session[roomID].username);
  this.session[roomID].alive = false;
  this.respond(200);
});

post("/room/:roomID/upload", function(roomID) {
  if(!isset(this.session[roomID], rooms[roomID])) {
    this.error();
    return;
  }
  var self = this;
  var file = this.param("file");
  var words = file.tempfile.split("-");
  var fileId = words[words.length-1];
  file.id = fileId;
  var fileDir = dirname(file.tempfile);
  fs.rename(file.tempfile, fileDir+"/"+fileId, function(err) {
    if(isset(err)) self.error();
    else {
      file.tempfile = fileDir+"/"+fileId;
      fs.stat(file.tempfile, function (err, stats) {
        Object.merge(file, stats);
        file.uploader = self.session[roomID].username;
        var usefulInfo = util.array_intersect_key_value(file, ["filename", "tempfile", "id", "size", "ctime", "uploader"]);
        rooms[roomID].announceFile(usefulInfo);
        self.respond(200);
      });
    }
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
get("/room/:roomID/files/:fileId", function(roomID, fileId){
  if(!isset(this.session[roomID], rooms[roomID])) {
    this.respond(200);
    return;
  }
  var self = this;
  var filepath = "/tmp/express-"+fileId;
  rooms[roomID].getFile(fileId, function(err, file, fileInfo) {
    if(isset(err) || !isset(file) || !isset(fileInfo)) self.respond(404);
    else {
      self.contentType(fileInfo.filename);
      self.header('Content-Disposition', 'attachment; filename="'+fileInfo.filename+'"');
      self.header("Content-Length", fileInfo.size+"; ");
      file.download(function(err, res) {
        self.sendfile(fileInfo.tempfile, function(err, res) {
          file.downloadFinished();
        });
      });
    }
  });
});

sys.puts("Init...");
// synchronous init to avoid running the whole app in the try catch of the connection
var initEnded = false;
init(function() {
  initEnded = true;
});


var stdin = process.openStdin();
process.addListener('SIGINT', function () {
  sys.puts("\nServer ended!");
  db.close();
  delete rooms;
  process.exit(0);
});

setInterval(function removeOldRooms() {
  if(initEnded == true) {
    sys.puts("Removing old rooms!");
    db.rooms.removeOldRooms(function() {
      sys.puts("Freeing no-user rooms!");
      for(var roomID in rooms)
        if(rooms[roomID].usrBuffer.size() == 0)
          delete rooms[roomID];
    });
  }
}, 3600 * 1000);

var runTimer = setInterval(function() {
  if(initEnded == true) {
    sys.puts("Running server now...");
    clearInterval(runTimer);
    run(port, host);
  }
}, 100);

