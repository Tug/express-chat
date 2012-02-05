
$(document).ready(function() {

  var socket = new io.connect();
  socket.on('connect', function() {
    socket.emit('connect', { sessionid: $.cookie("connect.sid") });
  });
  
  socket.on("uploadinfo", function(data) {
    if(data.fileurl) {
      var url = data.fileurl;
      if(data.serverUrl) {
        url = data.serverUrl + url;
      } else {
        url = window.location.host + url;
      }
      if(data.protocol) {
        url = data.protocol + "://" + url;
      } else {
        url = "http" + "://" + url;
      }
      showUrlCloud(url);
    }
  });
  
  var downloaders = {};
  var downId = 1;
  socket.on("newdl", function(data) {
    if(data.clientfileid && data.downloaderid) {
      var downloaderId = data.downloaderid;
      downloaders[downloaderId] = {};
      $("#downloads").append("<div id='"+downloaderId+"' class='downloader'><div class='title'>Client "+ (downId++) +"</div></div><br/>");
    }
  });
  socket.on("progress", function(data) {
    if(data.clientfileid && data.downloaderid) {
      var downloaderId = data.downloaderid;
      var subid = downloaderId + data.clientfileid;
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
    }
  });
  
});
