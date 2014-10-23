/**
 * @author Christian Brel <christian@the6thscreen.fr, ch.brel@gmail.com>
 */

/// <reference path="../../libsdef/node.d.ts" />
/// <reference path="../../libsdef/express.d.ts" />
/// <reference path="../../libsdef/socket.io-0.9.10.d.ts" />
/// <reference path="../../libsdef/socket.io-client.d.ts" />

/// <reference path="./socketmanager/ConnectionManager.ts" />
/// <reference path="./zonemanager/ZoneManager.ts" />
/// <reference path="./core/Logger.ts" />

var http = require("http");
var express = require("express");
var sio = require("socket.io");
var socketIOClient = require('socket.io-client');

/**
 * Represents the The 6th Screen Sources' Server.
 * Manage all data from retrieving to sending on the WebSocket connection.
 *
 * @class The6thScreenSourcesServer
 */
class The6thScreenSourcesServer {

    /**
     * List of ConnectionManager.
     *
     * @property _connectionManagers
     * @type Array<ConnectionManager>
     */
    private _connectionManagers: Array<ConnectionManager>;

    /**
     * Backend socket.
     *
     * @property _backendSocket
     * @private
     * @type any
     */
    private _backendSocket: any;

    /**
     * @constructor
     */
    constructor() {
        this._connectionManagers = new Array<ConnectionManager>();
    }

    /**
     * Method to run the server.
     *
     * @method run
     */
    run() {
        var self = this;

        this._connectToBackend();

        var listeningPort = process.env.PORT || 5000;

        var app = express();
        var httpServer = http.createServer(app);
        var io = sio.listen(httpServer);

        app.get('/', function(req, res){
            res.send('<h1>Are you lost ? * <--- You are here !</h1>');
        });

        var zoneNamespace = io.of("/zones");

        zoneNamespace.on('connection', function(socket){
            var connectionManager : ConnectionManager = new ConnectionManager(socket.id);
            self._connectionManagers[socket.id] = connectionManager;

            Logger.info("New The 6th Screen Zone Connection : " + socket.id);

            socket.on('newZone', function(zoneDescription) {
                Logger.info("newZone : " + JSON.stringify(zoneDescription));
                //zoneDescription - The new zone description : {id : number}
                if(connectionManager.retrieveZoneManager(zoneDescription.id) == null) {
                    Logger.debug("ZoneManager creation with ZoneId : " + zoneDescription.id);
                    var zoneManager : ZoneManager = new ZoneManager(zoneDescription.id, socket, self._backendSocket);
                    connectionManager.addZoneManager(zoneManager);
                } else {
                    Logger.warn("newZone - A Zone with same id already exist. Corresponding ZoneManager is not created.");
                }
            });

            socket.on('disconnect', function(){
                delete(self._connectionManagers[socket.id]);
                Logger.info("The 6th Screen Zone disconnected : " + socket.id);
            });
        });

        httpServer.listen(listeningPort, function(){
            Logger.info("The 6th Screen Sources' Server listening on *:" + listeningPort);
        });
    }

    private _connectToBackend() {
        var self = this;

        this._backendSocket = socketIOClient('http://localhost:4000/sources');

        this._backendSocket.on("connect", function() {
            Logger.info("Connected to Backend.");
        });

        this._backendSocket.on("error", function(errorData) {
            Logger.error("An error occurred during connection to Backend.");
            Logger.debug(errorData);
        });

        this._backendSocket.on("disconnect", function() {
            Logger.info("Disconnected to Backend.");
        });

        this._backendSocket.on("reconnect", function(attemptNumber) {
            Logger.info("Connected to Backend after " + attemptNumber + " attempts.");
        });

        this._backendSocket.on("reconnect_attempt", function() {
            //TODO?
        });

        this._backendSocket.on("reconnecting", function(attemptNumber) {
            Logger.info("Trying to connect to Backend - Attempt number " + attemptNumber + ".");
        });

        this._backendSocket.on("reconnect_error", function(errorData) {
            Logger.error("An error occurred during reconnection to Backend.");
            Logger.debug(errorData);
        });

        this._backendSocket.on("reconnect_failed", function() {
            Logger.error("Failed to connect to Backend. No new attempt will be done.");
        });
    }

    /**
     * Method to retrieve a ConnectionManager from this socketId.
     *
     * @method _retrieveConnectionManager
     * @private
     * @param {string} socketId - The zone's id
     * @returns {ConnectionManager} The ConnectionManager object corresponding to socket's id, null if not found.
     */
    private _retrieveConnectionManager(socketId : string) : ConnectionManager {
        Logger.debug("retrieving ConnectionManager");
        for(var i in this._connectionManagers) {
            var connectionManager = this._connectionManagers[i];
            if(connectionManager.getSocketId() == socketId) {
                Logger.debug("ConnectionManager found and return");
                return connectionManager;
            }
        }
        Logger.debug("Return null!");
        return null;
    }
}

var serverInstance = new The6thScreenSourcesServer();
serverInstance.run();