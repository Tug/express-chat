
function runFileClient(app) {
  
    var client = io.connect('/file');

    client.on('connect', function () {
        client.emit('user register', app.ROOMID, function(err) {
            app.uploader = loadUploader(app);
        });
    });

    client.on("status", function(file) {
        if(file.percent == 100) {
            app.unwatchFile(file);
        }
        app.updateFileStatus(file);
    });

    app.watchFile = function(file) {
    	client.emit('file watch', file.id);
    };

    app.unwatchFile = function(file) {
    	client.emit('file unwatch', file.id);
    };
    
}

