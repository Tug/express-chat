
var util = __dirname + "/util";
var vendors = __dirname + "/vendor";
var mongo = __dirname + "/mongo";

exports.configuration = 
{  host: ""//"localhost"
,  port: 3000
,  myip: "92.104.99.179"
,  expressmode: "development" //,"test","production"
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
   ,  PATH_PHPJS: util + "/phpjs.my.commonjs.min"
   ,  PATH_CLASS: vendors + "/class.js/lib/class"
   ,  DEBUG: true
   }
}
