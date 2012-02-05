
function loadUploader(app) {
  
  var fileList = new FileList(app.filelist);
  
  var uploader = new plupload.Uploader({
	  runtimes : 'gears,silverlight,flash,browserplus,html5,html4',
	  max_file_size : app.MAX_FILE_SIZE,
	  browse_button : app.browseButton.attr('id'),
	  unique_names : true,
	  multipart: true,
	  url : app.UP_URL,
	  flash_swf_url : app.PLUPLOAD_ROOT+'plupload.flash.swf',
	  silverlight_xap_url : app.PLUPLOAD_ROOT+'plupload.silverlight.xap',
	  multipart_params: { sessionid: app.SESSIONID }
  });

  uploader.bind('Init', function(up, params) {
    $('#runtimeInfo').html("Current runtime: " + params.runtime);
  });


  app.uploadButton.click(function(e) {
    uploader.start();
  });

  uploader.bind('FilesAdded', function(up, files) {
    files.forEach(function(fileInfo) {
      fileList.add(new File(fileInfo, fileList));
    });
    up.refresh(); // Reposition Flash/Silverlight
  });

  uploader.bind('UploadFile', function(up, file) {
    fileList.get(file.id).setStatus("Uploading");
  });

  uploader.bind('UploadProgress', function(up, file) {
    var fileObj = fileList.get(file.id);
    fileObj.setProgress(file.percent);
    fileObj.setSpeed(up.total.bytesPerSec);
  });

  uploader.bind('BeforeUpload', function(up, file) {
    up.settings.multipart_params.filesize = file.size;
    up.settings.multipart_params.fileid = file.id;
  });

  uploader.bind('Error', function(up, err) {
    alert(err.message);
    up.refresh(); // Reposition Flash/Silverlight
  });

  app.uploadModal.on('shown', function() {
    uploader.refresh();
  });
  
  app.uploadModal.on('hidden', function() {
    uploader.refresh();
  });

  uploader.init();

  return uploader;
}
