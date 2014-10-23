/**
 * @author Christian Brel <christian@the6thscreen.fr, ch.brel@gmail.com>
 */

/// <reference path="../../t6s-core/core-backend/libsdef/socket.io-0.9.10.d.ts" />
/// <reference path="../../libsdef/socket.io-client.d.ts" />

/// <reference path="../../t6s-core/core-backend/scripts/Logger.ts" />

var socketIOClient = require('socket.io-client');

/**
 * Manages Call for a Zone in The 6th Screen Client.
 *
 * @class Call
 */
class Call {

    /**
     * Call's id.
     *
     * @property _callId
     * @private
     * @type number
     */
    private _callId: number;

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
     * Call socket.
     *
     * @property _callSocket
     * @private
     * @type any
     */
    private _callSocket: any;

    /**
     * Call params.
     *
     * @property _params
     * @private
     * @type Object
     */
    private _params : Object;

    /**
     * @constructor
     */
    constructor(id : number, socket : SocketNamespace, backendSocket : any) {
        this._params = new Object();
        this._callId = id;
        this._zoneSocket = socket;
        this._backendSocket = backendSocket;
        this._init();
    }

    /**
     * Init Call.
     *
     * @method _init
     * @private
     */
    private _init() {
        var self = this;

        this._backendSocket.on("CallDescription", function(callDescription) {
            self.callDescriptionProcess(callDescription);
        });
        this._backendSocket.emit("RetrieveCallDescription", {"callId" : self._callId});
    }

    /**
     * Process the Call Description
     *
     * @method callDescriptionProcess
     * @param {JSON Object} callDescription - The call's description to process
     */
    private callDescriptionProcess(callDescription : any) {
        Logger.debug("callDescriptionProcess");
        var self = this;
        if(typeof(callDescription.callType) != "undefined") {
            var callTypeId = callDescription.callType["id"];
            this._backendSocket.on("CallTypeDescription", function(callTypeDescription) {
                self.callTypeDescriptionProcess(callTypeDescription);
            });
            this._backendSocket.emit("RetrieveCallTypeDescription", {"callTypeId" : callTypeId});
        }

        if(typeof(callDescription.paramValues) != "undefined") {
            for(var iParamValue in callDescription.paramValues) {
                var paramValueId = callDescription.paramValues[iParamValue]["id"];
                this._backendSocket.on("ParamValueDescription", function(paramValueDescription) {
                    self.paramValueDescriptionProcess(paramValueDescription, callDescription.paramValues[iParamValue]["value"]);
                });
                this._backendSocket.emit("RetrieveParamValueDescription", {"paramValueId" : paramValueId});
            }
        }
    }

    /**
     * Process the CallType Description
     *
     * @method callTypeDescriptionProcess
     * @param {JSON Object} callTypeDescription - The callType's description to process
     */
    callTypeDescriptionProcess(callTypeDescription : any) {
        var self = this;

        Logger.debug("callTypeDescriptionProcess");
        Logger.debug(callTypeDescription);

        if(typeof(callTypeDescription.source) != "undefined") {
            var sourceId = callTypeDescription.source["id"];
            this._backendSocket.on("SourceDescription", function(sourceDescription) {
                self.sourceDescriptionProcess(sourceDescription);
            });
            this._backendSocket.emit("RetrieveSourceDescription", {"sourceId" : sourceId});
        }
    }

    /**
     * Process the ParamValue Description
     *
     * @method paramValueDescriptionProcess
     * @param {JSON Object} paramValueDescription - The paramValue's description to process
     * @param {string} value - The paramValue's value
     */
    paramValueDescriptionProcess(paramValueDescription : any, value : string) {
        Logger.debug("paramValueDescriptionProcess");

        if(typeof(paramValueDescription.paramType) != "undefined" && typeof(paramValueDescription.paramType.name) != "undefined") {
            this._params[paramValueDescription.paramType.name] = value;
        }
    }

    /**
     * Process the Source Description
     *
     * @method sourceDescriptionProcess
     * @param {JSON Object} sourceDescription - The source's description to process
     */
    sourceDescriptionProcess(sourceDescription : any) {
        Logger.debug("sourceDescriptionProcess");

        var self = this;

        Logger.debug(sourceDescription);
        if(typeof(sourceDescription.paramTypes) != "undefined") {
            for (var iParamTypes in sourceDescription.paramTypes) {
                var paramTypeDescription = sourceDescription.paramTypes[iParamTypes];
                if(typeof(paramTypeDescription.name) != "undefined") {
                    if(typeof(this._params[paramTypeDescription.name]) == "undefined") {
                        //TODO : Error --> A value for paramType is missing...
                    }
                }
            }
        }

        if(typeof(sourceDescription.host) != "undefined" && typeof(sourceDescription.port) != "undefined" && typeof(sourceDescription.service) != "undefined" && typeof(sourceDescription.name) != "undefined") {
            var self = this;

            Logger.debug('Connection to source : ' + 'http://' + sourceDescription.host + ':' + sourceDescription.port + '/' + sourceDescription.service);
            Logger.debug(self._params);
            this._callSocket = socketIOClient('http://' + sourceDescription.host + ':' + sourceDescription.port + '/' + sourceDescription.service);
            this._callSocket.on("connect", function() {
                Logger.info("Connected to Service.");
                self._callSocket.emit(sourceDescription.name, self._params);
                Logger.debug("Call to Source : " + sourceDescription.name + " with params : ");
                Logger.debug(self._params);
            });

            this._callSocket.on("error", function(errorData) {
                Logger.error("An error occurred during connection to Service.");
                Logger.debug(errorData);
            });

            this._callSocket.on("disconnect", function() {
                Logger.info("Disconnected to Service.");
            });

            this._callSocket.on("reconnect", function(attemptNumber) {
                Logger.info("Connected to Service after " + attemptNumber + " attempts.");
            });

            this._callSocket.on("reconnect_attempt", function() {
                //TODO?
            });

            this._callSocket.on("reconnecting", function(attemptNumber) {
                Logger.info("Trying to connect to Service - Attempt number " + attemptNumber + ".");
            });

            this._callSocket.on("reconnect_error", function(errorData) {
                Logger.error("An error occurred during reconnection to Service.");
                Logger.debug(errorData);
            });

            this._callSocket.on("reconnect_failed", function() {
                Logger.error("Failed to connect to Service. No new attempt will be done.");
            });
        }
    }
}