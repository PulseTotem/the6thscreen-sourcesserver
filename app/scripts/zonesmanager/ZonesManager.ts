/**
 * @author Christian Brel <christian@the6thscreen.fr, ch.brel@gmail.com>
 */

/// <reference path="../../../libsdef/socket.io-0.9.10.d.ts" />

/// <reference path="../core/Logger.ts" />
/// <reference path="./Zone.ts" />

/**
 * Manage Zones for a The 6th Screen Client.
 *
 * @class ZonesManager
 */
class ZonesManager {

    /**
     * List of Zones.
     *
     * @property _zones
     * @type Array<Zone>
     */
    private _zones: Array<Zone>;

    /**
     * @constructor
     */
    constructor() {
        this._zones = new Array<Zone>();
    }


    /**
     * Method to add a new Zone.
     *
     * @method newZone
     * @param {string} zoneName - The zone name
     * @param {SocketNamespace} socket - The The6thScreen Client's socket.
     */
    newZone(zoneName : string, socket : SocketNamespace) {
        if(this._retrieveZone(zoneName) == null) {
            var zone = new Zone(zoneName, socket);
            this._zones.push(zone);
        } else {
            Logger.warn("ZonesManager : newZone - A Zone with same name already exist. Zone is not created.");
        }
    }

    /**
     * Method to retrieve a Zone from this name.
     *
     * @method _retrieveZone
     * @param {string} zoneName - The zone's name
     * @returns {Zone} The Zone object corresponding to zone's name, null if not found.
     */
    private _retrieveZone(zoneName : string) : Zone {
        for(var i in this._zones) {
            var zone = this._zones[i];
            if(zone.getName() == zoneName) {
                return zone;
            }
        }

        return null;
    }
}