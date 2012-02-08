

function loadFileList(fileList) {
  
  return {
    add : function(file) {
      fileList.append('<li id="'+file.id+'" class="fileListItem">'
                      +'<ul>'
                        +'<li class="filefield filenamefield">'
                          +file.name
                        +'</li>'
                        +'<li class="filefield fileprogressfield">'
                          +'<div class="progress">'
                            +'<div id="'+file.id+'progress" class="bar" style="width: 100%;"></div>'
                          +'</div>'
                        +'</li>'
                        +'<li class="filefield filestatusfield">'
                          +'<span id="'+file.id+'status" class="label">Queued</span>'
                        +'</li>'
                      +'</ul>'
                      +'</li>');
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