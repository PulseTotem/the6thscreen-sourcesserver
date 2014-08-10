/**
 * @author Christian Brel <christian@the6thscreen.fr, ch.brel@gmail.com>
 */

/// <reference path="../../libsdef/node.d.ts" />
/// <reference path="../../libsdef/express.d.ts" />
/// <reference path="../../libsdef/socket.io-0.9.10.d.ts" />

/// <reference path="./zonesmanager/ZonesManager.ts" />
/// <reference path="./core/Logger.ts" />

var http = require("http");
var express = require("express");
var sio = require("socket.io");

/**
 * Represents the The 6th Screen Sources' Server.
 * Manage all data from retrieving to sending on the WebSocket connection.
 *
 * @class The6thScreenSourcesServer
 */
class The6thScreenSourcesServer {

    /**
     * Method to run the server.
     *
     * @method run
     */
    run() {
        var listeningPort = process.env.PORT || 4000;

        var app = express();
        var httpServer = http.createServer(app);
        var io = sio.listen(httpServer);

        app.get('/', function(req, res){
            res.send('<h1>Are you lost ? * <--- You are here !</h1>');
        });

        io.on('connection', function(socket){
            Logger.info("New The 6th Screen Client Connection");

            var zonesManager = new ZonesManager();

            socket.on('zones/newZone', function(zoneDescription) {
                Logger.info("zones/newZone : " + JSON.stringify(zoneDescription));
                //zoneDescription - The new zone description : {name : string}
                zonesManager.newZone(zoneDescription.name, socket);
            });

            socket.on('disconnect', function(){
                Logger.info("The 6th Screen Client disconnected.");
            });
        });

        httpServer.listen(listeningPort, function(){
            Logger.info("The 6th Screen Sources' Server listening on *:" + listeningPort);
        });
    }
}

var serverInstance = new The6thScreenSourcesServer();
serverInstance.run();