
var express = require('express')
  , GrowingFile = require('../index')
  , mongodb = require('mongodb')
  , upload_middleware = require('upload-middleware');

var db = new mongodb.Db('test', new mongodb.Server("127.0.0.1", 27017, {}));
db.open(function(err, db) {
  if(err) console.log(err);
  else console.log("connected to MongoDB");
});

var app = express.createServer();
var PORT = 3000;

app.get('/', function(req, res) {
  res.send('<form method="post" enctype="multipart/form-data">'
    + '<p>File: <input type="file" name="file" /></p>'
    + '<p><input type="submit" value="Upload" /></p>'
    + '</form>');
});

app.get('/:filename', function(req, res, next) {
  var filename = req.params.filename;
  GrowingFile.open(db, filename, null, function(err, gf) {
    if(err) {
      next(err);
      return;
    }
    console.log("downloading "+filename+ " (size : "+gf.filesize+")");
    res.contentType(filename);
    res.attachment(filename);
    res.header('Content-Length', gf.filesize);
    gf.pipe(res);
  });
});

app.post('/', upload_middleware, function(req, res, next){

  var fileinfo = req.form.fileInfo;
  var filesize = req.form.fileInfo.filesize;
  console.log("http://localhost:"+PORT+"/"+fileinfo.filename);

  var gs = new GrowingFile.createGridStore(db, fileinfo.filename, {"filesize": filesize}, function(err, gs) {
    req.form.read();
  });
  
  req.form.speedTarget = 1000; // 1000 KB/s
  
  req.form.onChunk = function(data, callback) {
    gs.write(data, callback);
  };
  
  req.form.on('end', function() {
    gs.close(function(err, result) {
      res.send('ok');
    });
  });

  req.form.on('error', function(error) {
    console.log(error);
  });

  req.form.on('aborted', function() {
    console.log("client has disconnected");
    gs.unlink(function(err) {
      next(error);
    });
  });

});

app.listen(PORT);
console.log('Express app started on port 3000');


