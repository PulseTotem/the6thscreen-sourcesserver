/**
 * @author Christian Brel <christian@the6thscreen.fr, ch.brel@gmail.com>
 */

/// <reference path="../../../libsdef/socket.io-0.9.10.d.ts" />

/// <reference path="../core/Logger.ts" />

/**
 * Represents connection with a Zone in The 6th Screen Client.
 *
 * @class Zone
 */
class Zone {

    /**
     * Zone's name.
     *
     * @property _name
     * @private
     * @type string
     */
    private _name: string;

    /**
     * Zone's name.
     *
     * @property _socket
     * @private
     * @type SocketNamespace
     */
    private _socket: SocketNamespace;

    /**
     * @constructor
     */
    constructor(name : string, socket : SocketNamespace) {
        this._name = name;
        this._socket = socket;
        this._listen();
    }

    /**
     * Returns Zone's name.
     *
     * @returns {string} The zone's name.
     */
    getName() : string {
        return this._name;
    }

    /**
     * Listen for actions from client's zone.
     *
     * @method _listen
     * @private
     */
    private _listen() {
        var self = this;

        this._socket.on("zones/" + this._name + "/newCall", function(callDescription) {
            //callDescription - The call description : {id : number, source : string, hash : string}
            self._newCall(callDescription.id, callDescription.source, callDescription.hash);
        });
    }

    /**
     * Manage new call for current zone.
     *
     * @private
     * @param {number} id - Call's id.
     * @param {string} source - Call's id.
     * @param {string} hash - Call's hash.
     */
    private _newCall(id : number, source : string, hash : string) {
        //TODO
        Logger.info("Zone : _newCall - TODO : call params -> id: " + id + ", source: " + source + ", hash: " + hash);
    }
}