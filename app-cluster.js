var cluster = require('cluster');
var net     = require('net');

var userconfig  = require('./loadConfig');
var config      = require('./config')(userconfig);

if(cluster.isMaster) {
    var workers = [];
    var num = require('os').cpus().length;
    // Master will spawn `num` workers
    for (var i = 0; i < num; i++) {
        !function spawn(i) {
            workers[i] = cluster.fork();
            // Restart worker on exit
            workers[i].on('exit', function() {
                console.error('Worker '+i+' died');
                spawn(i);
            });
        }(i);
    }
    var seed = ~~(Math.random() * 1e9);
    net.createServer(function(c) {
        // Get int31 hash of ip
        var worker,
            ipHash = hash(c.remoteAddress, seed);

        //TODO: do we need this, error handling should be done in the worker no?
        // https://github.com/indutny/sticky-session/pull/12
        // handle errors like ECONNRESET on the socket
        c.on('error', function (err) {
            console.error('sticky: socket error', err);
        });

        // Pass connection to worker
        worker = workers[ipHash % workers.length];
        worker.send('sticky:connection', c);

    }).listen(config.port, config.hostname, function(err) {
        if(err) {
            console.log(err.stack || err);
            return;
        }
        console.log("Server's master process started on port "+config.port);
    });

} else {

    require('./loadApp')(userconfig, function(err, app, model, config, closeApp) {
        if(err) {
            console.error(err.stack || err);
            return;
        }

        var server = app.server;

        // Worker process
        process.on('message', function(msg, socket) {
            if(msg !== 'sticky:connection') return;
            server.emit('connection', socket);
        });

        // do not bind to port
        server.listen();

        console.log("Worker ready");

    }, false);

}

function hash(ip, seed) {
    var nums = (ip || '').split(/\./g);
    var hash = nums.reduce(function(r, num) {
        r += parseInt(num, 10);
        r %= 2147483648;
        r += (r << 10)
        r %= 2147483648;
        r ^= r >> 6;
        return r;
    }, seed);

    hash += hash << 3;
    hash %= 2147483648;
    hash ^= hash >> 11;
    hash += hash << 15;
    hash %= 2147483648;

    return hash >>> 0;
}
