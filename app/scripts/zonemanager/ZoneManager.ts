/**
 * @author Christian Brel <christian@the6thscreen.fr, ch.brel@gmail.com>
 */

/// <reference path="../../../libsdef/socket.io-0.9.10.d.ts" />

/// <reference path="../core/Logger.ts" />

/**
 * Manages connection with a Zone in The 6th Screen Client.
 *
 * @class ZoneManager
 */
class ZoneManager {

    /**
     * Zone's id.
     *
     * @property _zoneId
     * @private
     * @type number
     */
    private _zoneId: number;

    /**
     * Zone's socket.
     *
     * @property _socket
     * @private
     * @type SocketNamespace
     */
    private _zoneSocket: SocketNamespace;

    /**
     * @constructor
     */
    constructor(id : number, socket : SocketNamespace) {
        this._zoneId = id;
        this._zoneSocket = socket;
        this._listen();
    }

    /**
     * Returns Zone's id.
     *
     * @name getZoneId
     * @returns {number} The zone's id.
     */
    getZoneId() : number {
        return this._zoneId;
    }

    /**
     * Listen for actions from client's zone.
     *
     * @method _listen
     * @private
     */
    private _listen() {
        var self = this;

        this._zoneSocket.on("zones/" + this.getZoneId + "/newCall", function(callDescription) {
            //callDescription - The call description : {id : number}
            self._newCall(callDescription.id);
        });
    }

    /**
     * Manage new call for current zone.
     *
     * @private
     * @param {number} id - Call's id.
     */
    private _newCall(id : number) {
        // TODO - Retrieve Call information and connect to Service
        Logger.info("Zone : _newCall - TODO : call params -> id: " + id);
    }
}