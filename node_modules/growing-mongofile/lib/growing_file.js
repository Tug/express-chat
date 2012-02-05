var fs = require('fs');
var oop = require('oop');
var Stream = require('stream').Stream;
var mongodb = require('mongodb');

function GrowingFile() {
  Stream.call(this);

  this.readable = true;
  this.offset = 0;

  this.interval = 1000;
  this.timeout = 60000;
  this.readmetadata = true;
  this.filesize = 0;
  
  this._idleTime = 0;
  this._currentChunkNb = 0;
  this._lastChunkNb = 0;
  this._reading = false;
  this._paused = false;
  this._ended = false;
}
oop.extend(GrowingFile, Stream);
module.exports = GrowingFile;

GrowingFile.DOES_NOT_EXIST_ERROR = 'ENOENT';

/*
 * GrowingFile.open = function(db, filename [, options [, callback]])
 */
GrowingFile.open = function(db, filename, options, callback) {
  var file = new this();
  
  options = options || {};
  ['timeout', 'interval','readmetadata', 'filesize']
    .forEach(function(option) {
      if (option in options) {
        file[option] = options[option];
      }
    });
  
  callback = callback || function() {};
  
  file.filename = filename;
  file._gs = new mongodb.GridStore(db, filename, "r");
  file._chunkSize = file._gs.chunkSize;
  
  file._gs.open(function(err, gs) {
    if(err) {
      callback(err, gs);
      file._handleError(err);
      return;
    }
    if(file.readmetadata && gs.metadata) {
      file.metadata = gs.metadata;
      for(var key in gs.metadata) {
        file[key] = gs.metadata[key];
      }
    }
    callback(null, file);
    file._lastChunkNb = Math.floor( file.filesize / gs.chunkSize );
    file._readUntilEof();
  });
  
  file.on('end', function() {
    file._gs.close(function(){});
  });

  return file;
};

GrowingFile.createGridStore = function(db, filename, metadata, callback) {
  var gs = new mongodb.GridStore(db, filename, "w", {"metadata": metadata});
  gs.open(function(err, gs) {
    gs.close(function() {
      gs.mode = "w+";
      gs.open(callback);
    });
  });
  return gs;
}

GrowingFile.prototype.destroy = function() {
  this.readable = false;
};

GrowingFile.prototype.pause = function() {
  this._paused = true;
};

GrowingFile.prototype.resume = function() {
  if(this._paused === true) {
    this._paused = false;
    this._readUntilEof();
  }
};

GrowingFile.prototype.setTimeout = function(timeout) {
  this.timeout = timeout;
};

GrowingFile.prototype._readUntilEof = function() {
  if (this._paused || this._reading) {
    return;
  }

  this._reading = true;
  var self = this;
  this.nthChunk(this._currentChunkNb, function(err, chunk) {
    if(chunk && chunk.length() > 0) {
      self._gs.currentChunk = chunk;
      //self._gs.readBuffer(chunk.length(), function(err, buffer) {
      //  self._handleData(buffer);
      //  self._currentChunkNb = chunk.chunkNumber + 1;
      //  self._readUntilEof();
      //});
      self._handleData(chunk.readSlice(chunk.length()));
      self._currentChunkNb = chunk.chunkNumber + 1;
      self._readUntilEof();
    } else {
      self._handleEnd();
    }
  });
};

GrowingFile.prototype.nthChunk = function(chunkNumber, callback) {
  var self = this;
  var nextChunkNumber = chunkNumber + 1;
  this._gs.chunkCollection(function(err, chunkCollection) {
    // assumes chunks are being written in continuous order
    // if the next chunk is available it means the current chunk is completed
    // except for the last one, which is completed when the remaining size match
    // TODO: query each the max n
    chunkCollection.findOne({'files_id': self._gs.fileId, 'n': nextChunkNumber}, {fields: []}, function(err, nextChunk) {
      if(err || !nextChunk) {
        if(chunkNumber == self._lastChunkNb) {
          self._gs.collection(function(err, fileCollection) {
            fileCollection.findOne({'_id': self._gs.fileId}, function(err, file) {
              // filesize != 0 when file is complete
              if(!err && file && file.length == self.filesize) {
                self._gs.nthChunk(chunkNumber, callback);
              } else {
                callback(null, null);
              }
            });
          });
        } else {
          callback(null, null);
        }
      } else {
        self._gs.nthChunk(chunkNumber, callback);
      }
    });
  });
};

GrowingFile.prototype._retryInInterval = function() {
  setTimeout(this._readUntilEof.bind(this), this.interval);
  this._idleTime += this.interval;
};

GrowingFile.prototype._handleError = function(error) {
  this.readable = false;
  this._reading = false;
  this.emit('error', error);
};

GrowingFile.prototype._handleData = function(data) {
  this.offset += data.length;
  this._idleTime = 0;
  this._reading = false;
  this.emit('data', data);
};

GrowingFile.prototype._handleEnd = function() {
  this._reading = false;

  if (!this._reachedEnd()) {
    this._retryInInterval();
    return;
  }
  
  this.emit('end');
  this.emit('close');
  this.destroy();
};

GrowingFile.prototype._reachedEnd = function() {
  this._ended = (this._currentChunkNb > this._lastChunkNb);
  return (this._ended || this._timedOut());
};

GrowingFile.prototype._timedOut = function() {
  return (this._idleTime >= this.timeout);
};

