/**
 * @author Christian Brel <christian@the6thscreen.fr, ch.brel@gmail.com>
 */

/// <reference path="../../../libsdef/socket.io-0.9.10.d.ts" />

/// <reference path="../core/Logger.ts" />
/// <reference path="../zonemanager/ZoneManager.ts" />

/**
 * Stocks ZoneManagers for a specific socket.
 *
 * @class ConnectionManager
 */
class ConnectionManager {

    /**
     * Socket's id.
     *
     * @property _socketId
     * @private
     * @type string
     */
    private _socketId: string;

    /**
     * ZoneManager list.
     *
     * @property _zoneManagers
     * @private
     * @type Array<ZoneManager>
     */
    private _zoneManagers: Array<ZoneManager>;

    /**
     * @constructor
     */
    constructor(socketId : string) {
        this._socketId = socketId;
        this._zoneManagers = new Array<ZoneManager>();
    }

    /**
     * Returns Socket's id.
     *
     * @method getSocketId
     * @returns {string} The socket's id.
     */
    getSocketId() : string {
        return this._socketId;
    }

    /**
     * Adds a ZoneManager attached to socket.
     *
     * @method addZoneManager
     * @param {ZoneManager} zoneManager - The ZoneManager to add.
     */
    addZoneManager(zoneManager : ZoneManager) {
        this._zoneManagers.push(zoneManager);
    }

    /**
     * Method to retrieve a ZoneManager from zone's id.
     *
     * @method retrieveZoneManager
     * @param {number} zoneId - The zone's id
     * @returns {ZoneManager} The ZoneManager object corresponding to zone's id, null if not found.
     */
    retrieveZoneManager(zoneId : number) : ZoneManager {
        Logger.debug("retrieving Zone");
        for(var i in this._zoneManagers) {
            var zoneManager = this._zoneManagers[i];
            if(zoneManager.getZoneId() == zoneId) {
                Logger.debug("ZoneManager found and return");
                return zoneManager;
            }
        }
        Logger.debug("Return null!");
        return null;
    }
}