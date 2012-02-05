
var FileList = function(element) {
  this.files = {};
  this.element = element;
};

FileList.prototype.add = function(file) {
  this.files[file.id] = file;
  this.element.append(file.element);
};

FileList.prototype.get = function(fileid) {
  return this.files[fileid];
};

FileList.prototype.unselectAll = function() {
  for(var fileid in this.files) {
    var file = this.files[fileid];
    file.unselect();
  }
};

var File = function(fileInfo, fileList) {
  this.id = fileInfo.id;
  this.fileInfo = fileInfo;
  this.fileList = fileList;
  this.createElement();
};

File.prototype.createElement = function() {
  this.element = $(document.createElement("div"));
  this.element.attr("id", this.fileInfo.id);
  this.element.addClass("File");
  

  this.element.append(this.createNameDiv());
  //this.element.append(this.createProgressBarDiv());
  this.element.append(this.createStatusDiv());
  this.element.append(this.createSizeDiv());
  
  var self = this;
  this.element.click(function() {
    self.fileList.unselectAll();
    self.select();
  });
};

File.prototype.createNameDiv = function() {
  var nameElement = $(document.createElement("div"));
  nameElement.addClass("FileColumn FileName");
  nameElement.html(this.fileInfo.name);
  this.name = nameElement;
  return nameElement;
};

File.prototype.createProgressBarDiv = function() {
  var progressBarWrapper = $(document.createElement("div"));
  progressBarWrapper.addClass("FileColumn FileProgressBarWrapper");
  var progressBarElement = $(document.createElement("div"));
  progressBarElement.css("height", "100%");
  progressBarElement.addClass("FileProgressBar");
  progressBarElement.progressbar({value: 0});
  progressBarWrapper.append(progressBarElement);
  this.progressBarElement = progressBarElement;
  var progressTextElement = $(document.createElement("div"));
  progressTextElement.addClass("FileProgressText");
  progressBarWrapper.append(progressTextElement);
  this.progressTextElement = progressTextElement;
  this.setProgress(0);
  return progressBarWrapper;
};

File.prototype.setProgress = function(progress) {
  this.progress = progress;
  this.progressBarElement.progressbar("value",  progress);
  this.progressTextElement.html(""+progress+" %");
};

File.prototype.createStatusDiv = function() {
  var statusElement = $(document.createElement("div"));
  statusElement.addClass("FileColumn FileStatus");
  this.statusElement = statusElement;
  this.setStatus("Queuing");
  return statusElement;
};

File.prototype.setStatus = function(status) {
  this.status = status;
  this.statusElement.html(status);
};

File.prototype.setSpeed = function(speed) {
  this.speed = speed;
  this.statusElement.html(this.status+" at "+readableSize(speed)+"/s");
};

File.prototype.createSizeDiv = function() {
  var sizeElement = $(document.createElement("div"));
  sizeElement.addClass("FileColumn FileSize");
  sizeElement.html(readableSize(this.fileInfo.size));
  this.size = sizeElement;    
  return sizeElement;
};

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

File.prototype.select = function() {
  this.selected = true;
  this.element.css("background-color", "blue");
};

File.prototype.unselect = function() {
  this.selected = false;
  this.element.css("background-color", "white");
};

function FileDetails(id) {
  this.element = $(id);
  this.filename = $(document.createElement("div"));
  this.filename.attr("id", "fileDetailsName");
  this.filesize = $(document.createElement("div"));
  this.filesize.attr("id", "fileDetailsSize");
  this.filestatus = $(document.createElement("div"));
  this.filestatus.attr("id", "fileDetailsStatus");
  this.fileprogress = $(document.createElement("div"));
  this.fileprogress.attr("id", "fileDetailsProgress");
  this.estimatedRemainingTime = $(document.createElement("div"));
  this.estimatedRemainingTime.attr("id", "fileDetailsEstimatedRemainingTime");
  this.downloaders = $(document.createElement("div"));
  this.downloaders.attr("id", "fileDetailsDownloaders");
  this.element.append(this.filename);
  this.element.append(this.filesize);
  this.element.append(this.filestatus);
  this.element.append(this.fileprogress);
  this.element.append(this.estimatedRemainingTime);
  this.element.append(this.downloaders);
}

FileDetails.prototype.loadFile = function(file) {
  this.filename.html(file.name);
  this.filesize.html(file.size);
  this.filestatus.html(file.status);
  this.fileprogress.html(file.progress);
  this.estimatedRemainingTime.html("unknown");
  this.downloaders = new FileDetailsDownloaders(file);
}

