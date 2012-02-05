
var formidable = require('formidable');
var Stream = require('stream').Stream;

// copied from github.com/visionmedia/connect-form
function formRequest(req) {
  var contentType = req.headers['content-type'];
  if (!contentType) return;
  return req.body === undefined
    && (req.method === 'POST'
    || req.method === 'PUT')
    && (~contentType.indexOf('multipart/form-data'));
}


module.exports = function(req, res, next) {
  
  // check multipart request
  if(!formRequest(req)) {
    next(new Error("Request not a multipart/form-data"));
    return;
  }
  
  var form          = req.form          = new formidable.IncomingForm;
  
  form.currentSpeed = 0;      // should be read only
  form.uploaded     = 0;      // should be read only
  form.fileInfo     = {};     // should be read only
  form.speedTarget  = 20000;  // 20 MB/s
  
  // rewrite these functions to receive data chunks
  form.onChunk = function(data, callback) {};
  
  // save fields in form.fileInfo
  form.on('field', function(name, value) {
    form.fileInfo[name] = value;
  });
  
  // bufferize first chunks
  var chunks = [];
  var dataBufferedHandler = function(chunk) {
    chunks.push(chunk);
  };
  
  // overriding form onPart function
  form.onPart = function(part) {
	  if(!part.filename) { // processing fields
      form.handlePart(part);
    } else {             // processing file
	    form.fileInfo.filename = part.filename;
      // in case the file is uploaded with a flash client
      // or any other clients which cannot send the cookie in the header
      // (user needs to load session himself with req.sessionID)
	    if(form.fileInfo.sessionid) {
	      req.sessionID = form.fileInfo.sessionid;
      }
      // listen to data events until the form is resumed again
      part.on('data', dataBufferedHandler);
      part.on('data', statHandler);
      // once the parser has done parsing the boudary data
      // we can estimate the file size and call the next req action
      part.once('data', function(data) {
        var remainingSize = form.bytesExpected - form._parser.partDataMark;
        var boundaryEndSize = form._parser.boundary.length + 4;
        var filesize = remainingSize - boundaryEndSize;
        // if the filesize has been sent in a separate field
        // check if it's consistent
        if(form.fileInfo.filesize) {
          if(Math.abs(form.fileInfo.filesize - filesize) > 1000) { // 1KB difference allowed
            next(new Error('Size is larger than expected'));
            return;
          }
        } else { // otherwise creates the filesize field 
                 // max size check should be done by the user before calling start()
          form.fileInfo.filesize = filesize;
        }
        form.filePart = part;
        form.pause();
        next();
      });
    }
  };
  
  // live stats on data
  var lastTime = Date.now();
  var dtMean = 100, chunkSizeMean = 40900;
  var statHandler = function(chunk) {
    var bytesReceived = chunk.length;
    chunkSizeMean = 0.9 * chunkSizeMean + 0.1 * bytesReceived;
    var now = Date.now();
    dtMean = 0.9 * dtMean + 0.1 * (now - lastTime + 1);
    lastTime = now;
    form.currentSpeed = chunkSizeMean / dtMean;
    form.uploaded += bytesReceived;
  }
  
  // waits enough time for the upload to run at req.speedTarget
  // the wait delay should be auto-adaptative
  var dtCorrMean = 0;
  function wait(bytesReceived, callback) {
    var speedTarget = form.speedTarget;
    var chunkDelay = bytesReceived/ speedTarget; // B  /  B/ms  =  ms
    var currentSpeed = form.currentSpeed;
    var speedDiff = (1 - currentSpeed/speedTarget);
    var dtCorrection = chunkDelay * speedDiff;
    chunkDelay -= dtCorrection + dtCorrMean;
    dtCorrMean = 0.9 * dtCorrMean + 0.1 * dtCorrection
    if(chunkDelay < 1) chunkDelay = 0;
    if(chunkDelay > 3000) chunkDelay = 3000; // 3 sec for 40k = 12kb/s
    setTimeout(callback, chunkDelay);
  }
  
  // read next chunk in the chunks array
  // and pass it to form.onChunk
  function nextChunk(callback) {
    var chunk = chunks.shift();
    form.onChunk(chunk, function() {
      wait(chunk.length, function() {
        if(chunks.length == 0) callback();
        else nextChunk(callback);
      });
    });
	}
  
  // call read when ready to read the outputStream
  form.read = function(callback) {
    var processingChunks = false;
    var end = false;
    form.filePart.on('data', function(chunk) {
    	if(!processingChunks) {
    	  processingChunks = true;
    	  form.pause();
    	  nextChunk(function() {
    	    processingChunks = false;
    	    form.resume();
          if(end) {
            form.emit('close');
            return;
          }
    	  });
    	}
    });
    form.filePart.on('end', function() {
      end = true;
    });
    form.on('end', function() {
      end = true;
    });
    
    // emit bufferized chunks
//    req.form.filePart.removeListener('data', dataBufferedHandler);
//    while(chunks.length > 0)
//      form.filePart.emit('data', chunks.shift());
    // restart parsing
    form.resume();
  };
  
  // let's parse the form
  form.parse(req, function(err) {
    
  });
  
}


