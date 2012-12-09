
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
    
    function atBottom() {
        return (document.body.scrollHeight - document.body.scrollTop) == document.body.clientHeight;
    }
    
    var app = {

        ROOMID          : roomid,
        MAX_MSG_LEN     : 3000,
        MAX_USR_LEN     : 50,
        MAX_ROOMID_LEN  : 64,
        UP_URL          : '/r/'+roomid+'/upload',
        PLUPLOAD_ROOT   : '/static/lib/plupload/',
        MAX_FILE_SIZE   : '1000mb',
        msgCount        : 0,

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
        enterToSendCheckBox : $('#enterToSend'),
        
        showWelcomeMessage: function() {},
        
        addMessageToUl: function(msg) {
            var wasAtBottom = atBottom();
            app.messagesBox.append('<li>'+msg+'</li>');
            if(wasAtBottom) {
                document.body.scrollTop = app.messagesBox.get(0).scrollHeight;
            }
        },

        showMessage: function(msg) {
            app.msgCount = msg.num;
            var msgStr = '<div class="messageHeader">';
            msgStr += '<span class="nickname">'+htmlentities(msg.username)+'</span>';
            msgStr += ' - '+dateStr(msg.date);
            if(msg.num) {
                msgStr += ' - <span class="message-num">No.'+msg.num+'</span>';
            }
            msgStr += '</div><div class="message">';
            var file = msg.attachment;
            if(file && file.status != 'Removed') {
                file.url = "/r/"+app.ROOMID+"/download/"+file.servername;
                msgStr += '<p><a id="c'+file.servername+'link" href="'+file.url+'" target="_blank">'
                        +file.originalname
                        +'</a>'
                        +' - '+ readableSize(file.size)+' - '
                        +'<span id="c'+file.servername+'status">'
                        + file.status
                        +'</span> '
                        +'<span id="c'+file.servername+'progress">'
                        +'</span></p>';
                msgStr += getViewer(file);
            }
            msgStr += processMessage(msg.body);
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
            $('#c'+file.servername+'status').html(file.status);
            if(file.status == 'Uploading' && file.percent >= 0) {
                $('#c'+file.servername+'progress').html(file.percent+'%');
            } else {
                $('#c'+file.servername+'progress').html('');
            }
            if(file.status == 'Removed') {
                $('#c'+file.servername+'link').removeAttr('href');
            }
            //if(file.bytesPerSec)
            //    $('#'+file.servername+'speed').html(file.bytesPerSec);
        }
        
    }
    
    function getViewer(file) {
        if((/\.(gif|jpg|jpeg|tiff|png)$/i).test(file.originalname)) {
            return '<img class="image-small" id="img_'+file.servername+'" src="'+file.url+'" alt="'+file.originalname+'"></img>';
        } else if((/\.(mp3)$/i).test(file.originalname)) {
            return '<p id="'+file.servername+'_audio">Cannot load music player.</p>  ';
        } else if((/\.(flv|mp4)$/i).test(file.originalname)) {
            return '<div id="'+file.servername+'_video"></div>';
        }
        return '';
    }

    function loadViewer(file) {
        if((/\.(gif|jpg|jpeg|tiff|png)$/i).test(file.originalname)) {
            $('#img_'+file.servername).click(function() {
                $(this).toggleClass("image-small");
            });
        } else if((/\.(mp3)$/i).test(file.originalname)) {
            AudioPlayer.embed(file.servername+'_audio', {soundFile: file.url}); 
        } else if((/\.(flv|mp4)$/i).test(file.originalname)) {
            jwplayer(file.servername+'_video').setup({
                flashplayer: '/static/lib/jwplayer/player.swf',
                file: file.url,
                type: 'video',
                height: 363,
                width: 640
            });
        }
    }

    function processMessage(message) {
        var items = [];
        message = htmlentities(message, 'ENT_NOQUOTES');
        var replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
        var replacer = function(_, url, offset, string) {
            if(/^https?:\/\/(?:www\.)?youtube.com\/watch\?(?=.*v=\w+)(?:\S+)?$/.test(url)) { // youtube
                if(items.length <= 5) // limit to 5 objects per message
                    items.push('<p>'+embedYoutube(url)+'</p>');
            }
            return '<a href="'+url+'" target="_blank">'+url+'</a>';
        }
        var userMessage = message.replace(replacePattern1, replacer);
        return items.join('') + '<pre>'+userMessage+'</pre>';
    }

    function embedYoutube(link) {
        var strId = link.match(/v=[\w-]{11}/)[0].replace(/v=/,'')
        var result = '<div class="embedded-video">\n';
        result += '<object width="640" height="363">\n';
        result += '<param name="movie" value="http://www.youtube.com/v/' + strId + 'g&hl=en&fs=1&"></param>\n';
        result += '<param name="allowFullScreen" value="true"></param>\n';
        result += '<param name="allowscriptaccess" value="always"></param>\n';
        result += '<embed src="http://www.youtube.com/v/' + strId + '&hl=en&fs=1&" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="640" height="363"></embed>\n';
        result += '</object>\n';
        result += '</div>\n';
        return result;
     }

    runChatClient(app);
    runFileClient(app);

})

