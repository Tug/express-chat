
var util = __dirname + "/util";
var vendors = __dirname + "/vendor";
var mongo = __dirname + "/mongo";

exports.configuration = 
{  host: "localhost"
,  port: 3000
,  mongo:
   {  host: "localhost"
   ,  port: 27017
   }
,  globals:
   {  DIR_ROOT: __dirname
   ,  DIR_MONGO: mongo
   ,  DIR_VENDORS: vendors
   ,  DIR_UTIL: util
   ,  PATH_UTIL: util + "/util"
   ,  PATH_PHPJS: util + "/php.default.commonjs.min"
   ,  PATH_CLASS: vendors + "/class.js/lib/class"
   ,  DEBUG: true
   }
}
