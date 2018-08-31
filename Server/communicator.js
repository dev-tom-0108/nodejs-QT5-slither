// Import others
var Global = require('./global.js');
var fs = require('fs');

var https = require('https');
var WebSocketServer = require('websocket').server;

// Establish HTTP server

var server = https.createServer({
    key : fs.readFileSync('security/apiclient_key.pem'),
    cert : fs.readFileSync('security/apiclient_cert.pem')
}, function(request, response) {
});

server.listen(Global.serverPort, function () {
    console.log(Global.startingPoint + ' Server is listening on port ' + Global.serverPort);
})

// Establish Websocket server
var wsServer = new WebSocketServer({
    httpServer : server
});

wsServer.on('request', function (request) {
    var socket = request.accept(null, request.origin);

    // User sent some request
    socket.on('message', function(message) {
        // Decode the command
        var msg = JSON.parse(message.utf8Data);
        var cmd = msg.cmd;
        var detail = msg.detail;

        if (detail == undefined)
            detail = {};
        if (cmd != 'info')
            detail.id = socket.id;
        
        switch (cmd) {
            case 'info':
                ServerJS.verify(socket, detail);
                break;
            case 'join':
                ServerJS.joinGame(socket, detail);
                break;
            case 'rotate':
                detail.socket = socket;
                ServerJS.parseCmd(cmd, detail)
                break;
            case 'assets':
                AssetsJS.downloadAssets(socket);
                break;
            case 'color':
                ServerJS.changeColor(detail.id, detail.color);
                break;
            case 'rate':
                ServerJS.rateThis(detail.id);
                break;
            default:
                ServerJS.parseCmd(cmd, detail);
                break;
        }
    })

    socket.on('close', function(heathen) {
        // remove disconnected player
        ServerJS.fire(socket);
    })
})

// Methods for external operations for communication
function sendCmd(socket, cmd, detail) {
    if (socket != undefined)
        socket.send(JSON.stringify({ cmd : cmd, detail : detail }));
}

module.exports = {
    sendCmd : sendCmd,
}

var AssetsJS = require('./assets.js');
var ServerJS = require('./server.js');