
var crypto  = require('crypto');
var Step = require('step');

(function(exports) {
    
    exports.randomString = function(strlen) {
        strlen = strlen || 8;
        var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
        var randstr = '';
        for (var i=0; i<strlen; i++) {
            var rnum = Math.floor(Math.random() * chars.length);
            randstr += chars.substring(rnum,rnum+1);
        }
        return randstr;
    }

    exports.cast = function(obj, SubClass) {
        for(var key in SubClass.prototype)
            if(SubClass.prototype.hasOwnProperty(key))
                obj[key] = SubClass.prototype[key];
    };

    exports.clone = function (obj) {
        if(obj == null || typeof(obj) != 'object')
            return obj;
        var temp = obj.constructor();
        for(var key in obj)
            temp[key] = clone(obj[key]);
        return temp;
    }

    exports.find = function(arr, el) {
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

    exports.array_intersect_key_value = function(arr1, arr2) {
        var out = {};
        for(var i in arr2) {
            var key = arr2[i];
            out[key] = arr1[key];
        }
        return out;
    }

    exports.arrayChain = function (arr, func, callback) {
        var actions = arr.map(function(el) { return function() { func(el) }; });
        actions.push(callback);
        Step.apply(this, actions);
    }

    exports.md5 = function(plaintext) {
        return crypto.createHash("md5").update(""+plaintext).digest('hex');
    }

    exports.clientIP = function(req) {
        var ip_address = null;
        try {
            ip_address = req.headers['x-forwarded-for'];
        } catch(error) {
            ip_address = req.connection.remoteAddress;
        }
        if(ip_address == null) ip_address = "127.0.0.1";
        return ip_address;
    }

    exports.retryAsync = function(func, num, errorCallback) { 
        var actions = [];
        for(var i=0; i<num; i++) actions.push(func);
        actions.push(errorCallback);
        Step.apply(null, actions);
    }

})(exports);
