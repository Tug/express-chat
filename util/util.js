// Express-chat - Copyright (C) 2010 T. de Kerviler <dekervit@gmail.com> (GPL)

var Step = require(DIR_VENDORS + "/step/lib/step");
﻿var fs = require("fs");

var generateRandomString = function(strlen) {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var randstr = '';
	for (var i=0; i<strlen; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randstr += chars.substring(rnum,rnum+1);
	}
	return randstr;
}

var cast = function(obj, SubClass) {
  for(var key in SubClass.prototype)
    if(SubClass.prototype.hasOwnProperty(key))
      obj[key] = SubClass.prototype[key];
};

var clone = function (obj) {
    if(obj == null || typeof(obj) != 'object')
        return obj;
    var temp = obj.constructor();
    for(var key in obj)
        temp[key] = clone(obj[key]);
    return temp;
}

var find = function(arr, el) {
  if(el instanceof Object) {
    var strel = JSON.stringify(el);
    for(var i=0; i<arr.length; i++)
      if(JSON.stringify(arr[i]) == strel)
        return i;
  } else {
    for(var i=0; i<arr.length; i++)
      if(arr[i] == el)
        return i;
  }
  return -1;
}

/*
 * ex : arr1 = { a:1, b:2, c:3 }
 *      arr2 = [ a, b ] or { 0:"a", 1:"b" }
 *      return { a:1, b:2 }
 * note: arr2's values must be keys of arr1
 */
var array_intersect_key_value = function(arr1, arr2) {
  var out = {};
  for(var i in arr2) {
    var key = arr2[i];
    out[key] = arr1[key];
  }
  return out;
}


var readFileInChunks = function(filepath, chunkSize, callback) {
  fs.open(filepath, "r", 0666, function(err, fd) {
    var pos = 0;
    var end = false;
    var read = function(start) {
      fs.read(fd, chunkSize, start, "binary", function(err, data, bytesRead) {
        start += bytesRead;
        callback(null, data, bytesRead, function() {
          read(start);
        });
      });
    }
    read(0);
  });
}



var arrayChain = function (arr, func, callback) {
  var actions = arr.map(function(el) { return function() { func(el) }; });
  actions.push(callback);
  Step.apply(this, actions);
}


exports.generateRandomString = generateRandomString;
exports.cast = cast;
exports.find = find;
exports.clone = clone;
exports.array_intersect_key_value = array_intersect_key_value;
exports.readFileInChunks = readFileInChunks;
exports.arrayChain = arrayChain;

