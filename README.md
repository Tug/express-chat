# express-chat

  A simple chat application using a database built on **node.js**, **Express** and **MongoDB**.
  This project has the objective of testing the scalability of the architecture **node.js + MongoDB**.
  Once the application is finished, a stress test will be run on a cluster.

  We also want to test the GridFS functionality of MongoDB.
  Thus, the application should be able to upload and share files between users of a room.


## Installation

  git clone git://github.com/Tug/express-chat.git

  cd express-chat

  perl init.pl
    or git submodule update --init in express-chat and in express-chat/vendor/express folders

  Modify the config file:
    host: "localhost" or "" whether you want to run it as local or not
    port: port for the server (if 80 you will probably need to run the application as root)
    myip: IP address of the current machine or its domain name (only used in the DB to redirect users)

  Installation of node.JS

    git clone git://github.com/ry/node.git
    cd node
    git checkout v0.1.96
    ./configure
    make
    
    # if you ar root:
    sudo make install

    # else modify NODE variable in Makefile to you path where the node binary is (ex: NODE= ~/node/node)

  Installation of MongoDB:

    # download the binaries corresponding to your machine on MongoDB download page:
    # http://www.mongodb.org/display/DOCS/Downloads
    wget http://downloads.mongodb.org/linux/mongodb-linux-x86_64-1.4.3.tgz

    # extract the file
    tar -zxvf mongodb-linux-x86_64-1.4.2.tgz

    # if you are root, install it in /opt:
    sudo mkdir -p /opt/mongo
    sudo mv  ./mongodb-linux-x86_64-1.4.2/* /opt/mongo
    sudo mkdir -p /data/db
  
    # set your user as propriertary 
    sudo chown -R tug /opt/mongo
    sudo chown -R tug /data/db

    # run mongoDB daemon with
    /opt/mongo/bin/mongod

    # the mongodb client is in
    /opt/mongo/bin/mongo

    # if you are user
    sudo mv  ./mongodb-linux-x86_64-1.4.2/* ~/mongo
    sudo mkdir -p ~/data/db

    # run mongoDB daemon with
    ~/mongo/bin/mongod --dbpath ~/data/db

  Run the chat
    # Launch mongoDB daemon then the application:
    make
    # or
    node app.js

    # or modify and use the upstart conf files in express-chat/daemon

