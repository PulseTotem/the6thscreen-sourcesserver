/**
 * @author Christian Brel <christian@the6thscreen.fr, ch.brel@gmail.com>
 */

/// <reference path="../../t6s-core/core-backend/scripts/Logger.ts" />

/// <reference path="../../t6s-core/core-backend/scripts/server/NamespaceManager.ts" />
/// <reference path="../zonemanager/Call.ts" />

class ZonesNamespaceManager extends NamespaceManager {

    /**
     * List of Calls.
     *
     * @property _calls
     * @type Array<Call>
     */
    private _calls: Array<Call>;

    /**
     * Constructor.
     *
     * @constructor
     * @param {any} socket - The socket.
     */
    constructor(socket : any) {
        super(socket);

        this._calls = new Array<Call>();

        this.addListenerToSocket('newZone', this.processZoneDescription);
    }

    /**
     * Process Zone description.
     *
     * @method processZoneDescription
     * @param {any} zoneDescription - The Zone Description.
     * @param {ZonesNamespaceManager} self - The ZonesNamespaceManager instance.
     */
    processZoneDescription(zoneDescription : any, self : ZonesNamespaceManager = null) {
        Logger.info("newZone : " + JSON.stringify(zoneDescription));
        //zoneDescription - The new zone description : {id : number}

        if(self == null) {
            self = this;
        }

        var zoneId : number = zoneDescription.id;

        self.addListenerToSocket("zones/" + zoneId + "/newCall", function(callDescription, zoneNamespaceInstance) {
            zoneNamespaceInstance._calls.push(new Call(callDescription.id, zoneId, self.socket));
        });
    }
}