
function runFileClient(app) {
  
    var client = io.connect('/file');

    client.on('connect', function () {
        client.emit('register user', app.ROOMID, function(err) {
            var up = loadUploader(app);
        });
    });
    
    client.on('new file', app.notifyFile);

    client.on("progress", function(data) {
        if(!data.fileid || !data.progress) {
            return;
        }
        var fileid = data.fileid;
        var progress = data.progress;
        if(!downloaders[downloaderId][data.clientfileid]) {
            $("#"+downloaderId).append(  "<div id='"+subid+"'>" + $("#"+data.clientfileid).html()
                                    + " <div id='dlPBCont"+subid+"' class='progressBG'>"
                                    + "<div id='dlPB"+subid+"' class='progress'></div>"
                                    + " </div><div id='percent"+subid+"' style='display:inline;'></div></div><br/>");
            downloaders[downloaderId][data.clientfileid] = true;
        }
        $("#dlPBCont"+subid).show();
        $("#dlPB"+subid).css("width", data.percent+'%');
        $("#percent"+subid).html(data.percent+' %');
      });
}

