
# Express-chat

Express chat is a node.js multi-server chat application with file exchange capabilities.
Messages are sent with Socket-IO and saved in MongoDB.
Users can stream files in MongoDB/GridFS directly!


## Requirements
* Node.js >= v0.6.2
* MongoDB and Redis installed and running.

## Installation
* git clone git://github.com/Tug/express-chat.git
* cd express-chat
* npm install .

## Configuring
The config.json file will overwrite properties definied in config.js. Edit it to set your configuration properties such as database host, port, username, password, etc.


## Running
* node app
or
* node app myconfig.js


## TODO
* fix bugs with plupload :  html5 runtime errors with multiple files, http error content not displayed, max upload file size not detected with some runtimes...
* Load test
* Script deployment
* improve UI : use backbone and mix client and server views, announce new message, add connecting...
* Set a minimum delay per client for uploads and messages