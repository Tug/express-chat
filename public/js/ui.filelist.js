

function loadFileList(app) {
  
  var fileList = app.fileList;
  
  function readableSize(size) {
      if(size == null) return 'unknown';
      var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      var i = 0;
      while(size >= 1024) {
          size /= 1024;
          ++i;
      }
      return size.toFixed(1) + ' ' + units[i];
  }
  
  return {
    add : function(file) {
      fileList.append('<div id="'+file.id+'">'
                        + file.name
                        +'<div id="'+file.id+'status">Queued</div>'
                        +'<div class="progress">'
                          +'<div id="'+file.id+'progress" class="bar" style="width: 0%;"></div>'
                        +'</div>'
                        +'<div id="'+file.id+'speed"></div>'
                      +'</div>');
    },

    update : function(file) {
      if(file.percent)
        $('#'+file.id+'progress').width(file.percent);
      if(file.status)
        $('#'+file.id+'status').html(file.status);
      if(file.bytesPerSec)
        $('#'+file.id+'speed').html(readableSize(file.bytesPerSec)+'/s');
    },
    
    clear : function(file) {
      fileList.html('');
    }
    
  };
  
}