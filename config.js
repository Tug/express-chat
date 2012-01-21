var path = require("path"),
    fs = require("fs");

global.application_root = __dirname;

var config = {
  hostname : "localhost",
  port : 3000,
  database : {
    mongodb: {
      db: "db",
      host: "localhost",
      port: 27017,
    },
    redis: {
        host: "localhost",
        port: 6379
    }
  },
  views : {
    type: "html",
    //engine: require("jqtpl").express,
    cache: "enable", //disable
    options : {
        layout: false
    }
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
  session : {
    secret : "mouse dog",
    cookie : {
      maxAge: 24 * 3600 * 1000, // need the cookie while uploading with flash so max upload time is 24h
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

