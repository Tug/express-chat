
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

var find = function(arr, el) {
  for(var i=0; i<arr.length; i++)
    if(arr[i] == el)
      return i;
  return -1;
};

var clone = function (obj) {
    if(obj == null || typeof(obj) != 'object')
        return obj;
    var temp = obj.constructor();
    for(var key in obj)
        temp[key] = clone(obj[key]);
    return temp;
}

﻿/*
 * Inspired from 'Do' library by creationix
 * use callbacks instead of continuations.
 * !!! Does not work with closures !!!
 * => Step lib is used instead
 */
 var sys = require('sys');
var chain = function(actions, callback) {
  if (!(actions instanceof Array)) {
    actions = Array.prototype.slice.call(arguments);
  }
  var length = actions.length;
  if(length > 0) {
    var pos = length-1;
    var tempfunc = callback;
    while(pos --> 0) {
      tempfunc= function(err, input) { actions[pos](input, tempfunc) };
    }
    tempfunc(null);
  } else {
    callback(new Error("no actions specified"), null);
  }
}


exports.generateRandomString = generateRandomString;
exports.cast = cast;
exports.find = find;
exports.chain = chain;
exports.clone = clone;

