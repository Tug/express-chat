var path = require("path"),
    fs = require("fs");

global.application_root = __dirname;

var config = {
  hostname : "localhost",
  port : 3000,
  database : {
    mongodb: {
      uri: "mongodb://localhost:27017/db"
    },
    redis: {
        host: "localhost",
        port: 6379
    }
  },
  views : {
    type: "html",
    engine: require('ejs').__express,
    cache: "enable" //disable
  },
  paths : {
    root : application_root,
    app : path.join(application_root,"app"),
    public_root : path.join(application_root,"public"),
    models : path.join(application_root,"app","models"),
    views :  path.join(application_root,"app","views"),
    libs : path.join(application_root,"app","libs"),
    controllers : path.join(application_root,"app","controllers"),
    crons : path.join(application_root,"app","crons"),
    favicon : path.join(application_root,"public","favicon.ico")
  },
  urls : require("./urls").urls,
  ios : require("./urls").ios,
  session : {
    secret : "rgkervdgmigeccxvfezf",
    key: "express.sid",
    cookie : {
      maxAge: 24 * 3600 * 1000,
      path: "/",
      httpOnly: false
    },
    reapInterval: 15 * 60 * 1000,
    engine: "redis" // "mongodb", false
  }
};

module.exports = function(userconfig) {
    if(userconfig)
        config = require("./lib/util").mergeRecursive(config, userconfig);
    return config;
}

