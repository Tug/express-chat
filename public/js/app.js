
$(document).ready(function() {

    var MAX_MSG_LEN = 500;
    var MAX_USR_LEN = 50;
    var MAX_ROOMID_LEN = 64;

    var roompath = document.location.pathname;
    var roomid = roompath.replace('/r/', '');
    var nextmsgnum = 1;
    var users = [];
    var username = "Anonymous";
    
    var messagebox = $('#message');
    var namebox = $('#name');
    var messagesbox = $('#messages');
    var usersbox = $('#users');
    var submitMessage = $('#submitMessageButton');

    var online = false;
    
    var client = io.connect("/chat");
    client.on('connect', function () {
        client.emit('join room', roomid, function(err, name) {
            username = name;
            namebox.val(username);
            refreshUserList();
        });
    });

    client.on('ready', function() {
        online = true;
        showWelcomeMessage();
    });

    client.on('new message', addMessage);
    client.on('new messages', addMessages);
    client.on('users', setUsers);
    client.on('user joined', userJoined);
    client.on('user left', userLeft);
    client.on('user renamed', userRenamed);
    
    function sendMessage(message) {
        if(message) {
            if(message > MAX_MSG_LEN) message = message.substr(0, MAX_MSG_LEN);
		        client.emit("message", message);
        }
    }

    function changeUsername(newname) {
        if(newname) {
            if(newname > MAX_USR_LEN) newname = newname.substr(0, MAX_USR_LEN);
		        client.emit("username change", newname, function(err, name) {
                if(err) {
                    alert(err);
                } else {
                    userRenamed({oldname: username, newname: name});
                    username = name;
                }
            });
        }
    }

    function addMessage(msg) {
        if(msg.num >= nextmsgnum) {
            nextmsgnum = msg.num + 1;
        }
        showMessage(formatMessage(msg));
    }

    function addMessages(messages) {
        if(messages && messages.constructor === Array) {
            messages.forEach(addMessage);
        }
    }

    function setUsers(newusers) {
        if(newusers.constructor === Array) {
            users = newusers;
            refreshUserList();
        }
    }

    function userJoined(newuser) { 
        users.push(newuser);
        refreshUserList();
        showMessage(" * "+newuser+" joined the room.");
    }

    function userLeft(olduser) {
        for(var i=0; i<users.length; i++) {
            if(users[i] === olduser) {
                users.splice(i,1);
                break;
            }
        }
        refreshUserList();
        showMessage(" * "+olduser+" left the room.");
    }

    function userRenamed(obj) {
        var oldname = obj.oldname;
        var newname = obj.newname;
        for(var i=0; i<users.length; i++) {
            if(users[i] === oldname) {
                users[i] = newname;
                break;
            }
        }
        refreshUserList();
        showMessage(" * "+oldname+" is now known as "+newname+".");
    }
    
    submitMessage.click(postMessage);
    bindEnter(messagebox, postMessage);
    
    function postMessage() {
        var msg = messagebox.val();
        if(msg != '\n') {
            sendMessage(msg);
            addMessage({username: username, body: msg});
        }
        messagebox.val('');
    }
    
    bindEnter(namebox, function() {
        var name = namebox.val();
        if(name && name != username) {
            //if($.inArray(name, users) != -1) {
            //    alert("Username already in use !");
            //} else {
                changeUsername(name);
            //}
        }
        messagebox.val('');
    });

    function bindEnter(component, callback) {
        component.keyup(function(e) {
            var code = (e.keyCode ? e.keyCode : e.which);
            if(code == 13) { // ENTER
                callback();
            }
        });
    }

    function formatMessage(msg) {
        return msg.username + ": " + msg.body;
    }

    function showMessage(msg) {
        messagesbox
          .append('<li>' + htmlentities(msg) + '</li>')
          .get(0).scrollTop = messagesbox.get(0).scrollHeight
    }

    function showWelcomeMessage() {
        showMessage("Welcome on the room. You are known as "+htmlentities(username)+".");
    }

    function refreshUserList() {
        users.sort(function(a,b){return a.toLowerCase() > b.toLowerCase()});
        usersbox.empty();
        $.each(users, function(i, usr) {
            usersbox.append('<li>' + htmlentities(usr) + '</li>');
        });
    }

})

