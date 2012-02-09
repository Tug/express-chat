

function loadFileList(fileList) {
  
  function getStatusString(status) {
    switch(status) {
      case plupload.QUEUED: return "Queued";
      case plupload.UPLOADING: return "Uploading";
      case plupload.FAILED: return "Failed";
      case plupload.DONE: return "Done";
    }
    return "";
  }
  var lastStatus = -1000;
  
  return {
    add : function(file) {
      fileList.append('<li id="'+file.id+'">'
                      +'<ul class="nav fileitem">'
                        +'<li class="filenamefield">'
                          +file.name
                        +'</li>'
                        +'<li class="fileprogressfield">'
                          +'<div class="progress">'
                            +'<div id="'+file.id+'progress" class="bar" style="width: 0%;"></div>'
                          +'</div>'
                        +'</li>'
                        +'<li class="filestatusfield">'
                          +'<span id="'+file.id+'status" class="label">Queued</span>'
                        +'</li>'
                      +'</ul>'
                      +'</li>');
    },

    update : function(file) {
      if(file.percent)
        $('#'+file.id+'progress').width(file.percent+'%');
      if(file.bytesPerSec)
        $('#uploadSpeed').html(readableSize(file.bytesPerSec)+'/s');
      if(file.status != lastStatus) {
        lastStatus = file.status;
        var statusStr = getStatusString(file.status);
        $('#'+file.id+'status').html(statusStr);
        $('#'+file.id+'status').removeClass('success');
        $('#'+file.id+'status').removeClass('notice');
        $('#'+file.id+'status').removeClass('important');
        switch(file.status) {
          case plupload.QUEUED:    break;
          case plupload.UPLOADING: $('#'+file.id+'status').addClass('notice'); break;
          case plupload.FAILED:    $('#'+file.id+'status').addClass('important'); break;
          case plupload.DONE:      $('#'+file.id+'status').addClass('success'); break;
        }
      }
    },
    
    clear : function(file) {
      fileList.html('');
    }
    
  };
  
}