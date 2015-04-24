/**
 * @author Christian Brel <christian@the6thscreen.fr, ch.brel@gmail.com>
 */

/// <reference path="../t6s-core/core-backend/scripts/server/Server.ts" />
/// <reference path="../t6s-core/core-backend/scripts/Logger.ts" />
/// <reference path="./namespacemanager/CallsNamespaceManager.ts" />

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
     * Constructor.
     *
     * @param {number} listeningPort - Server's listening port..
     * @param {Array<string>} arguments - Server's command line arguments.
     */
    constructor(listeningPort : number, arguments : Array<string>) {
        super(listeningPort, arguments);

        this.addNamespace("calls", CallsNamespaceManager);
    }
}

/**
 * Server's SourcesServer listening port.
 *
 * @property _SourcesServerListeningPort
 * @type number
 * @private
 */
var _SourcesServerListeningPort : number = process.env.PORT || 5000;

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