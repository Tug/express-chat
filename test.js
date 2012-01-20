
var express = require('express');

var app = express.createServer();

function handler(req, res, next) {
    setTimeout(function() {
        res.send('ok');
    }, 100);
    next();
}

function postmid1(req, res, next) {
    //console.log('hello 1');
    next();
}

function postmid2(req, res, next) {
    //console.log('hello 2');
    next();
}

function endmid(req, res, next) {
    return;
}

app.get('/', handler, postmid1, postmid2, endmid);

app.listen(3000);
