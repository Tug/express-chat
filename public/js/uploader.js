
function loadUploader(app) {
  
  var fileList = loadFileList(app.fileList);
  
  var uploader = new plupload.Uploader({
	  runtimes : 'html4,html5,gears,flash,silverlight,browserplus',
	  max_file_size : app.MAX_FILE_SIZE,
	  browse_button : app.browseButton.attr('id'),
	  container: app.uploadModal.attr('id'),
	  unique_names : true,
	  multipart: true,
	  url : app.UP_URL,
	  flash_swf_url : app.PLUPLOAD_ROOT+'plupload.flash.swf',
	  silverlight_xap_url : app.PLUPLOAD_ROOT+'plupload.silverlight.xap',
	  multipart_params: { cookie: document.cookie }
  });

  uploader.bind('Init', function(up, params) {
    $('#runtimeInfo').html("Current runtime: " + params.runtime);
  });

  app.uploadButton.click(function(e) {
    if (uploader.files.length > 0) {
        uploader.start();
        
    } else {
        alert('Select a file first.');
    }
  });

  app.hideModalButton.click(function(e) {
    app.uploadModal.modal('hide');
  });

  uploader.bind('FilesAdded', function(up, files) {
    files.forEach(fileList.add);
    up.refresh(); // Reposition Flash/Silverlight
  });
  
  uploader.bind('UploadFile', function(up, file) {
    fileList.update(file);
  });

  uploader.bind('UploadProgress', function(up, file) {
    file.bytesPerSec = up.total.bytesPerSec;
    fileList.update(file);
  });

  uploader.bind('BeforeUpload', function(up, file) {
    up.settings.multipart_params.filesize = file.size;
    up.settings.multipart_params.fileid = file.id;
  });
  
  uploader.bind('FileUploaded', function(up, file, res) {
    file.percent = 100;
    fileList.update(file);
  });

  uploader.bind('Error', function(up, err) {
    alert('Error for '+err.file.name+' : '+err.message);
    up.refresh(); // Reposition Flash/Silverlight
  });

  app.uploadModal.on('shown', function() {
    //uploader.refresh();
  });
  
  app.uploadModal.on('hidden', function() {
    //uploader.refresh();
  });

  uploader.init();

  return uploader;
}



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

