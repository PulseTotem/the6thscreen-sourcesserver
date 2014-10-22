/**
 * @author Christian Brel <christian@the6thscreen.fr, ch.brel@gmail.com>
 */

/// <reference path="../../../libsdef/socket.io-0.9.10.d.ts" />

/// <reference path="../core/Logger.ts" />
/// <reference path="./Call.ts" />

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
     * @property _zoneSocket
     * @private
     * @type SocketNamespace
     */
    private _zoneSocket: SocketNamespace;

    /**
     * Backend socket.
     *
     * @property _backendSocket
     * @private
     * @type any
     */
    private _backendSocket: any;

    /**
     * List of Calls.
     *
     * @property _calls
     * @type Array<Call>
     */
    private _calls: Array<Call>;

    /**
     * @constructor
     */
    constructor(id : number, socket : SocketNamespace, backendSocket : any) {
        Logger.debug("New Zone Manager");
        Logger.debug(id);
        Logger.debug(socket);
        Logger.debug(backendSocket);

        this._zoneId = id;
        this._zoneSocket = socket;
        this._backendSocket = backendSocket;
        this._calls = new Array<Call>();
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

        Logger.debug("Listen");

        this._zoneSocket.on("zones/" + this.getZoneId + "/newCall", function(callDescription) {
            //callDescription - The call description : {id : number}
            Logger.debug("newCall");
            Logger.debug(callDescription);
            self._calls.push(new Call(callDescription.id, self._zoneSocket, self._backendSocket));
        });
    }
}