/**
 * @author Christian Brel <christian@the6thscreen.fr, ch.brel@gmail.com>
 */

/// <reference path="../t6s-core/core-backend/scripts/server/Server.ts" />
/// <reference path="../t6s-core/core-backend/scripts/Logger.ts" />
/// <reference path="./namespacemanager/ZonesNamespaceManager.ts" />

/// <reference path="../libsdef/socket.io-client.d.ts" />

var socketIOClient = require('socket.io-client');

/**
 * Represents the The 6th Screen Sources' Server.
 * Manage all data from retrieving to sending on the WebSocket connection.
 *
 * @class The6thScreenSourcesServer
 * @extends Server
 */
class The6thScreenSourcesServer extends Server {

    /**
     * Backend socket.
     *
     * @property backendSocket
     * @private
     * @type any
     */
    static backendSocket: any = null;

    /**
     * Constructor.
     *
     * @param {number} listeningPort - Server's listening port..
     * @param {Array<string>} arguments - Server's command line arguments.
     */
    constructor(listeningPort : number, arguments : Array<string>) {
        super(listeningPort, arguments);

        this.init();
    }

    /**
     * Method to init the RSSFeedReader server.
     *
     * @method init
     */
    init() {
        var self = this;

        this._connectToBackend();

        this.addNamespace("zones", ZonesNamespaceManager);
    }

    /**
     * Manage connection to Backend.
     *
     * @method _connectToBackend
     * @private
     */
    private _connectToBackend() {
        var self = this;

        The6thScreenSourcesServer.backendSocket = socketIOClient('http://localhost:4000/sources',
            {"reconnection" : true, "reconnectionDelay" : 1000, "reconnectionDelayMax" : 5000, "timeout" : 10000, "autoConnect" : true});

        The6thScreenSourcesServer.backendSocket.on("connect", function() {
            Logger.info("Connected to Backend.");
        });

        The6thScreenSourcesServer.backendSocket.on("error", function(errorData) {
            Logger.error("An error occurred during connection to Backend.");
            Logger.debug(errorData);
        });

        The6thScreenSourcesServer.backendSocket.on("disconnect", function() {
            Logger.info("Disconnected to Backend.");
        });

        The6thScreenSourcesServer.backendSocket.on("reconnect", function(attemptNumber) {
            Logger.info("Connected to Backend after " + attemptNumber + " attempts.");
        });

        The6thScreenSourcesServer.backendSocket.on("reconnect_attempt", function() {
            //TODO?
        });

        The6thScreenSourcesServer.backendSocket.on("reconnecting", function(attemptNumber) {
            Logger.info("Trying to connect to Backend - Attempt number " + attemptNumber + ".");
        });

        The6thScreenSourcesServer.backendSocket.on("reconnect_error", function(errorData) {
            Logger.error("An error occurred during reconnection to Backend.");
            Logger.debug(errorData);
        });

        The6thScreenSourcesServer.backendSocket.on("reconnect_failed", function() {
            Logger.error("Failed to connect to Backend. No new attempt will be done.");
        });
    }
}

/**
 * Server's SourcesServer listening port.
 *
 * @property _SourcesServerListeningPort
 * @type number
 * @private
 */
var _SourcesServerListeningPort : number = process.env.PORT_SOURCESSERVER || 5000;

/**
 * Server's SourcesServer command line arguments.
 *
 * @property _SourcesServerArguments
 * @type Array<string>
 * @private
 */
var _SourcesServerArguments : Array<string> = process.argv;

var serverInstance = new The6thScreenSourcesServer(_SourcesServerListeningPort, _SourcesServerArguments);
serverInstance.run();