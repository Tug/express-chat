
function runFileClient(app) {
  
    var client = io.connect('/file');

    client.on('connect', function () {
        client.emit('register user', app.ROOMID, function(err) {
            var up = loadUploader(app);
        });
    });
    
    client.on('new file', app.notifyFile);

}

