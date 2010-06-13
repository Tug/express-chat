
var util = __dirname + "/util";
var vendors = __dirname + "/vendor";
var mongo = __dirname + "/mongo";
var phpjs = util + "/phpjs.my.commonjs.min";

exports.configuration =
{  host: ""
,  port: 3000
,  myip: "92.104.99.179"
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
   ,  PATH_PHPJS: phpjs
   ,  PATH_CLASS: vendors + "/class.js/lib/class"
   ,  PATH_MONGOFILES: "/opt/mongo/bin/mongofiles"
   ,  DEBUG: true
   ,  DB_NAME: "express-mongo-chat"
   ,  MAX_MSG_LEN: 500
   ,  MAX_USR_LEN: 30
   ,  MAX_FILE_SIZE: 1 * 1024 //in KB
   ,  isset: require(phpjs).isset
   ,  array_merge: require(phpjs).array_merge
   }
}

