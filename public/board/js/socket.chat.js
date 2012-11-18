
function runChatClient(app) {
    
    var client = io.connect('/chat');
    
    client.on('new message',  addMessage);
    client.on('new messages', addMessages);
    
    client.on('ready',        app.showWelcomeMessage);
    client.on('users',        app.setUsers);
    client.on('user joined',  app.userJoined);
    client.on('user left',    app.userLeft);
    client.on('user renamed', app.userRenamed);

    client.on('connect', function () {
        client.emit('join room', app.ROOMID, function(err, name) {
            if(err) console.log(err);
            app.username = name;
            app.nameBox.val(name);
        });
    });

    function addMessage(msg) {
        if(msg.date != null) {
            msg.date = new Date(msg.date);
        }
        app.showMessage(msg);
    }
    
    function addMessages(messages) {
        if(messages && messages.constructor === Array) {
            messages.forEach(addMessage);
        }
    }

    function bindEnter(component, callback) {
        component.keyup(function(e) {
            var code = (e.keyCode ? e.keyCode : e.which);
            if(code == 13) { // ENTER
                callback();
            }
        }).keydown(function(e) {
            var code = (e.keyCode ? e.keyCode : e.which);
            if (code == 13) {
              e.preventDefault();
            }
        });
    }

    function unbindEnter(component) {
        component.unbind('keyup').unbind('keydown');
    }
    
    app.submitMessageButton.click(sendMessageHandler);
    app.renameButton.click(renameHandler);
    
    app.enterToSendCheckBox.click(function() {
        if($(this).is(':checked')) {
            bindEnter(app.messageBox, sendMessageHandler);
        } else {
            unbindEnter(app.messageBox, sendMessageHandler);
        }
    });
    
    function sendMessageHandler() {
        var msg = app.messageBox.val();
        if(msg && msg != '\n') {
            if(msg.length > app.MAX_MSG_LEN) {
                msg = msg.substr(0, app.MAX_MSG_LEN);
            }
            sendMessage(msg);
        }
        app.messageBox.val('');
    }
    
    function renameHandler() {
        var name = app.nameBox.val();
        if(name && name != app.username) {
            changeUsername(name);
        }
    }

    function sendMessage(message) {
        client.emit("message", message);
    }

    function changeUsername(newname) {
        if(newname) {
            if(newname > app.MAX_USR_LEN) newname = newname.substr(0, app.MAX_USR_LEN);
		        client.emit("change name", newname, function(err, name) {
                if(err) {
                    alert(err);
                } else {
                    app.userRenamed({ oldname: app.username, newname: newname });
                }
            });
        }
    }

}

