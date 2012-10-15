
$(document).ready(function() {

    var roompath = document.location.pathname;
    var roomid = roompath.replace('/r/', '');
    var nextmsgnum = 1;
    
    var app = {

        ROOMID          : roomid,
        MAX_MSG_LEN     : 500,
        MAX_USR_LEN     : 50,
        MAX_ROOMID_LEN  : 64,
        UP_URL          : '/r/'+roomid+'/upload',
        PLUPLOAD_ROOT   : '/js/lib/plupload/',
        MAX_FILE_SIZE   : '1000mb',
        
        users           : [],
        username        : 'Anonymous',

        messageBox          : $('#message'),
        nameBox             : $('#name'),
        messagesBox         : $('#messages'),
        usersBox            : $('#users'),
        submitMessageButton : $('#submitMessageButton'),
        fileList            : $('#fileList'),
        browseButton        : $('#upFile'),
        uploadButton        : $('#upSendBtn'),
        renameButton        : $('#renameButton'),
        uploadModal         : $('#upload-modal'),
        
        showWelcomeMessage: function() {
            app.showSystemMessage("Welcome on the room. You are known as "+htmlentities(app.username)+".");
        },
        
        showMessage: function(username, words) {
            var msg = '<span class="nickname">'+htmlentities('<'+username+'>')+'</span> '+linkify(htmlentities(words));
            app.addMessageToUl(msg);
        },
        
        addMessageToUl: function(msg) {
            app.messagesBox
              .append('<li>'+msg+'</li>')
              .parent().get(0).scrollTop = app.messagesBox.get(0).scrollHeight;
        },

        showSystemMessage: function(msg) {
            app.addMessageToUl('* '+msg);
        },

        setUsers: function(newusers) {
            if(newusers.constructor === Array) {
                app.users = newusers;
                app.refreshUserList();
            }
        },

        userJoined: function(newuser) {
            if(newuser != null) {
                app.users.push(newuser);
                app.refreshUserList();
                app.showSystemMessage(newuser+" joined the room.");
            }
        },

        userLeft: function(olduser) {
            for(var i=0; i<app.users.length; i++) {
                if(app.users[i] === olduser) {
                    app.users.splice(i,1);
                    break;
                }
            }
            app.refreshUserList();
            app.showSystemMessage(olduser+" left the room.");
        },

        userRenamed: function(obj) {
            var oldname = obj.oldname;
            var newname = obj.newname;
            for(var i=0; i<app.users.length; i++) {
                if(app.users[i] === oldname) {
                    app.users[i] = newname;
                    break;
                }
            }
            app.refreshUserList();
            app.showSystemMessage(oldname+" is now known as "+newname+".");
        },

        refreshUserList: function() {
            var allusers = app.users.slice(0);
            allusers.push(app.username);
            allusers.sort(function(a,b){return a.toLowerCase() > b.toLowerCase()});
            app.usersBox.empty();
            $.each(allusers, function(i, usr) {
                app.usersBox.append('<li>' + htmlentities(usr) + '</li>');
            });
        },

        setUsername: function(newusername) {
            app.username = newusername;
            app.nameBox.val(newusername);
            app.refreshUserList();
            app.showSystemMessage("You are now known as "+htmlentities(newusername)+".");
        },

        notifyFile: function(file) {
            var msg = file.uploadername+' is sharing '
                      +'<a href="'+file.url+'" target="_blank">'+file.name+'</a>'
                      +' - '+readableSize(file.size)
                      +' - <span id="c'+file.id+'status">'
                        +'Uploading <span id="c'+file.id+'progress">0</span>%'
                      +'</span>';
            app.showSystemMessage(msg);
        },
        
        updateFileProgress: function(file) {
            if(file.percent) {
              $('#c'+file.id+'progress').html(file.percent);
              if(file.percent == 100) {
                $('#c'+file.id+'status').html('Completed');
              }
            }
            //if(file.bytesPerSec)
            //    $('#'+file.id+'speed').html(file.bytesPerSec);
        }
        
    }

    runChatClient(app);
    runFileClient(app);

})

