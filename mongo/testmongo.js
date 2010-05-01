GLOBAL.DEBUG = true;
require.paths.unshift("../express/lib");
require("express");
require("express/plugins");
var sys = require("sys");
var User = require("../util/util").User;
var mongo = require("./mydb");
var test = require("mjsunit");

var db = new mongo.MyDB();

sys.puts("db connect");
db.connect(function(db) {
  sys.puts("db clear");
  db.clear(function(err, result) {
    sys.puts("init rooms");
    db.initRooms(function(err, rooms) {
      var john = new User("John Doe");
      sys.puts("create room");
      db.rooms.createRoom(john, function(err, room) {
        sys.puts("add user");
        room.addUser(john, function(err, j) {
          sys.puts("get users");
          room.getUsers(function(err, users) {
            test.assertEquals(1, users.length);
            test.assertEquals("John Doe", users[0].name);
            sys.puts("add user message");
            room.addUserMessage(john, "Hello!", function(err, msg) {
              sys.puts("get last message 0");
              room.getLastMessages(0, function(err, messages) {
                test.assertEquals(2, messages.length);
                sys.puts("change user name");
                room.changeUserName(john, "John Deuf", function(err, msg) {
                  sys.puts("get last message 2");
                  room.getLastMessages(2, function(err, messages2) {
                    test.assertEquals(1, messages2.length);
                    sys.puts("add a 2nd user");
                    room.addUser(new User("Quidam"), function(err, j) {
                      sys.puts("get user");
                      room.getUser(john.id, function(err, usr2) {
                        test.assertEquals("John Deuf", usr2.name);
                        endInit = true;
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

