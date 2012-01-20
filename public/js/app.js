
$(document).ready(function() {

function randomString() {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = 8;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}

    var roompath = document.location.pathname;
    var roomid = roompath.replace('/r/', '');
    var nextmsgnum = 1;
    var users = [];
    var username = "user"+randomString();
    var serverMount = 'bayeux';
    
    var messagebox = $('#message');
    var namebox = $('#name');
    namebox.val(username);
    var messagesbox = $('#messages');
    var usersbox = $('#users');
    var submitMessage = $('#submitMessageButton');

    var online = false;
    
    var client = io.connect("/chat");
    client.on('connect', function () {
        var data = {
            username: username,
            roomid: roomid
        };
        client.emit('join room', data);
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
		        client.emit("message", message);
        }
    }

    function changeUsername(newname) {
        if(newname) {
		        client.emit("username change", newname, function(err, name) {
                if(!err) {
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
            if($.inArray(name, users) != -1) {
                alert("Username already in use !");
            } else {
                changeUsername(name);
            }
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
          .append('<li>' + msg + '</li>')
          .get(0).scrollTop = messagesbox.get(0).scrollHeight
    }

    function showWelcomeMessage() {
        showMessage("Welcome on the room.");
    }

    function refreshUserList() {
        users.sort(function(a,b){return a.toLowerCase() > b.toLowerCase()});
        usersbox.empty();
        $.each(users, function(i, usr) {
            usersbox.append('<li>' + usr + '</li>');
        });
    }

})

