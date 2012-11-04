
$(document).ready(function() {

    var roompath = document.location.pathname;
    var roomid = roompath.replace('/r/', '');
    var nextmsgnum = 1;
    
    function dateStr(dateObj) {
        dateObj = dateObj || new Date();
        return '<span class="msgdate">'+date('j M Y, g:i:s a', (dateObj.getTime()/1000))+'</span> ';
    }

    function readExtension(filename) {
        return /(?:\.([^.]+))?$/.exec(filename)[1];
    }
    
    var app = {

        ROOMID          : roomid,
        MAX_MSG_LEN     : 3000,
        MAX_USR_LEN     : 50,
        MAX_ROOMID_LEN  : 64,
        UP_URL          : '/r/'+roomid+'/upload',
        PLUPLOAD_ROOT   : '/static/lib/plupload/',
        MAX_FILE_SIZE   : '1000mb',
        
        username        : 'Anonymous',

        messageBox          : $('#messageBox'),
        nameBox             : $('#nameBox'),
        messagesBox         : $('#messagesBox'),
        submitMessageButton : $('#submitMessageButton'),
        fileList            : $('#fileList'),
        browseButton        : $('#upFile'),
        uploadButton        : $('#upSendBtn'),
        renameButton        : $('#renameButton'),
        fileContainer       : $('#fileContainer'),
        clearFilesButton    : $('#clearFiles'),
        
        showWelcomeMessage: function() {},
        
        addMessageToUl: function(msg) {
            var scroll = (app.messagesBox.scrollTop() == app.messagesBox.height());
            app.messagesBox.append('<li>'+msg+'</li>');
            if (scroll) {
                app.messagesBox.parent().get(0).scrollTop = app.messagesBox.get(0).scrollHeight;
            }
        },

        showMessage: function(msg) {
            var msgStr = '<div class="messageHeader">';
            msgStr += '<span class="nickname">'+htmlentities(msg.username)+'</span>';
            msgStr += ' - '+dateStr(msg.date);
            if(msg.num) {
                msgStr += ' - <span class="message-num">No.'+msg.num+'</span>';
            }
            msgStr += '</div><div class="message">';
            var file = msg.attachment;
            if(file && file.status != 'Removed') {
                file.url = "/r/"+app.ROOMID+"/download/"+file.id;
                msgStr += '<p><a id="c'+file.id+'link" href="'+file.url+'" target="_blank">'
                        +file.originalname
                        +'</a>'
                        +' - '+ readableSize(file.size)+' - '
                        +'<span id="c'+file.id+'status">'
                        + file.status
                        +'</span> '
                        +'<span id="c'+file.id+'progress">'
                        +'</span></p>';
                msgStr += getViewer(file);
            }
            msgStr += '<pre>'+linkify(htmlentities(msg.body, 'ENT_NOQUOTES'))+'</pre>';
            msgStr += '</div>';
            app.addMessageToUl(msgStr);
            if(file) {
                if(file.status == 'Uploading') {
                    app.watchFile(file);
                }
                loadViewer(file);
            }
        },

        showSystemMessage: function(msg) {
            app.addMessageToUl('* ' + msg);
        },

        setUsers: function(newusers) {},
        userJoined: function(newuser) {},
        userLeft: function(olduser) {},

        userRenamed: function(obj) {
            var oldname = obj.oldname;
            var newname = obj.newname;
            if(oldname == app.username) {
                var msg = "You are now known as "+htmlentities(newname)+".";
                app.username = newname;
                app.nameBox.val(newname);
                app.showSystemMessage(msg);
            }
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
    
    function getViewer(file) {
        if((/\.(gif|jpg|jpeg|tiff|png)$/i).test(file.originalname)) {
            return '<img class="image" src="'+file.url+'" alt="'+file.originalname+'"></img>';
        } else if((/\.(mp3)$/i).test(file.originalname)) {
            return '<p id="'+file.id+'_audio">Cannot load music player.</p>  ';
        } else if((/\.(flv|mp4)$/i).test(file.originalname)) {
            return '<div id="'+file.id+'_video" class="flowplayer is-splash" data-volume="0.5" data-engine="flash">'
                  +'<video preload="none" type="video/'+readExtension(file.originalname)+'" src="'+file.url+'"></video>'
                  +'</div>';
        }
        return '';
    }

    function loadViewer(file) {
        if((/\.(mp3)$/i).test(file.originalname)) {
            AudioPlayer.embed(file.id+'_audio', {soundFile: file.url}); 
        } else if((/\.(flv|mp4)$/i).test(file.originalname)) {
            $('#'+file.id+'_video').flowplayer().load();
        }
    }

    runChatClient(app);
    runFileClient(app);

})

