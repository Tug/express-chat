
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
        hideModalButton     : $('#hideModalBtn'),
        renameButton        : $('#renameButton'),
        uploadModal         : $('#upload-modal'),
        clearFilesButton    : $('#clearFiles'),
        
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
            if(oldname == app.username) {
                msg = "You are now known as "+htmlentities(newname)+".";
                app.username = newname;
                app.nameBox.val(newname);
            } else {
                msg = htmlentities(oldname)+" is now known as "+htmlentities(newname)+".";
            }
            app.showSystemMessage(msg);
        },

        refreshUserList: function() {
            var allusers = app.users.slice(0);
            allusers.sort(function(a,b){return a.toLowerCase() > b.toLowerCase()});
            app.usersBox.empty();
            $.each(allusers, function(i, usr) {
                app.usersBox.append('<li>' + htmlentities(usr) + '</li>');
            });
        },

        notifyFile: function(file, text) {
            var msg = file.uploadername+' '+(text || 'is sharing')+' '
                      +'<a id="c'+file.id+'link" href="'+file.url+'" target="_blank">'
                      +file.originalname
                      +'</a>'
                      +' - '+ readableSize(file.size)+' - '
                      +'<span id="c'+file.id+'status">'
                      + file.status
                      +'</span> '
                      +'<span id="c'+file.id+'progress">'
                      +'</span>'
            app.showSystemMessage(msg);
        },

        updateFileStatus: function(file) {
            $('#c'+file.id+'status').html(file.status);
            if(file.status == 'Uploading' && file.percent >= 0) {
                $('#c'+file.id+'progress').html(file.percent+'%');
            } else {
                $('#c'+file.id+'progress').html('');
            }
            if(file.status == 'Removed') {
                $('#c'+file.id+'link').attr('href', '#');
            }
            //if(file.bytesPerSec)
            //    $('#'+file.id+'speed').html(file.bytesPerSec);
        }
        
    }

    runChatClient(app);
    runFileClient(app);

})

