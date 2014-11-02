/**
 * @author Christian Brel <christian@the6thscreen.fr, ch.brel@gmail.com>
 */

/// <reference path="../../t6s-core/core-backend/libsdef/socket.io-0.9.10.d.ts" />
/// <reference path="../../libsdef/socket.io-client.d.ts" />

/// <reference path="../../t6s-core/core-backend/scripts/Logger.ts" />
/// <reference path="../../t6s-core/core-backend/scripts/ForEachAsync.ts" />

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
     * @type any
     */
    private _zoneSocket: any;

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
     * Source ParamTypes Description.
     *
     * @property _sourceParamTypesDescription
     * @private
     * @type any
     */
    private _sourceParamTypesDescription: any;

    /**
     * Source host.
     *
     * @property _sourceHost
     * @private
     * @type string
     */
    private _sourceHost : string;

    /**
     * Source port.
     *
     * @property _sourcePort
     * @private
     * @type string
     */
    private _sourcePort : string;

    /**
     * Source service.
     *
     * @property _sourceService
     * @private
     * @type string
     */
    private _sourceService : string;

    /**
     * Source name.
     *
     * @property _sourceName
     * @private
     * @type string
     */
    private _sourceName : string;

    /**
     * State of retrieving source information.
     *
     * @property _sourceReady
     * @private
     * @type boolean
     */
    private _sourceReady : boolean;

    /**
     * State of retrieving params values.
     *
     * @property _paramsReady
     * @private
     * @type Object
     */
    private _paramsReady : Object;

    /**
     * Number of Params.
     *
     * @property _paramsLength
     * @private
     * @type number
     */
    private _paramsLength : number;

    /**
     * @constructor
     */
    constructor(id : number, zoneId : number, socket : any) {
        this._params = new Object();
        this._callId = id;
        this._zoneId = zoneId;
        this._zoneSocket = socket;
        this._paramsLength = 0;
        this._sourceReady = false;
        this._paramsReady = new Object();
        Logger.debug("Construct");
        Logger.debug(this._paramsReady);
        this._listen();
        this._init();
    }

    /**
     * Listen for descriptions reception.
     *
     * @method _listen
     * @private
     */
    private _listen() {
        var self = this;

        The6thScreenSourcesServer.backendSocket.on("zones/" + this._zoneId + "/calls/" + this._callId + "/CallDescription", function(callDescription) {
            self.callDescriptionProcess(callDescription);
        });

        The6thScreenSourcesServer.backendSocket.on("zones/" + this._zoneId + "/calls/" + this._callId + "/CallTypeDescription", function(callTypeDescription) {
            self.callTypeDescriptionProcess(callTypeDescription);
        });

        The6thScreenSourcesServer.backendSocket.on("zones/" + this._zoneId + "/calls/" + this._callId + "/SourceDescription", function(sourceDescription) {
            self.sourceDescriptionProcess(sourceDescription);
        });

        The6thScreenSourcesServer.backendSocket.on("zones/" + this._zoneId + "/calls/" + this._callId + "/ParamValueDescription", function(paramValueDescription) {
            self.paramValueDescriptionProcess(paramValueDescription);
        });
    }

    /**
     * Init Call.
     *
     * @method _init
     * @private
     */
    private _init() {
        The6thScreenSourcesServer.backendSocket.emit("RetrieveCallDescription", {"zoneId" : this._zoneId, "callId" : this._callId});
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

            The6thScreenSourcesServer.backendSocket.emit("RetrieveCallTypeDescription", {"zoneId" : this._zoneId, "callId" : this._callId, "callTypeId" : callTypeId});
        }

        if(typeof(callDescription.paramValues) != "undefined") {
            this._paramsLength = callDescription.paramValues.length;
            ForEachAsync.forEach(callDescription.paramValues, function(iParamValue) {
                var paramValue = callDescription.paramValues[iParamValue];
                var paramValueId = paramValue["id"];

                self._paramsReady[paramValueId] = false;
                Logger.debug("callDescriptionProcess paramsReady");
                Logger.debug(self._paramsReady);

                The6thScreenSourcesServer.backendSocket.emit("RetrieveParamValueDescription", {"zoneId" : self._zoneId, "callId" : self._callId, "paramValueId" : paramValueId});
            });
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

            The6thScreenSourcesServer.backendSocket.emit("RetrieveSourceDescription", {"zoneId" : this._zoneId, "callId" : this._callId, "sourceId" : sourceId});
        }
    }

    /**
     * Process the ParamValue Description
     *
     * @method paramValueDescriptionProcess
     * @param {JSON Object} paramValueDescription - The paramValue's description to process
     * @param {string} value - The paramValue's value
     */
    paramValueDescriptionProcess(paramValueDescription : any) {
        Logger.debug("paramValueDescriptionProcess");

        if(typeof(paramValueDescription.paramType) != "undefined" && typeof(paramValueDescription.paramType.name) != "undefined"  && typeof(paramValueDescription.value) != "undefined") {
            this._params[paramValueDescription.paramType.name] = paramValueDescription.value;

            this._paramsReady[paramValueDescription.id] = true;
            Logger.debug("paramValueDescriptionProcess paramsReady");
            Logger.debug(this._paramsReady);

            this._connectToSource();
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
            this._sourceParamTypesDescription = sourceDescription.paramTypes;
        }

        if(typeof(sourceDescription.host) != "undefined" && typeof(sourceDescription.port) != "undefined" && typeof(sourceDescription.service) != "undefined" && typeof(sourceDescription.name) != "undefined") {
            this._sourceHost = sourceDescription.host;
            this._sourcePort = sourceDescription.port;
            this._sourceService = sourceDescription.service;
            this._sourceName = sourceDescription.name;

            this._sourceReady = true;

            this._connectToSource();
        }
    }

    /**
     * Connection to Source.
     *
     * @method _connectToSource
     * @private
     */
    private _connectToSource() {
        var self = this;

        var paramsOk = true;
        var paramsReadyLength = 0;

        Logger.debug("avant boucle check paramsReady");
        Logger.debug(this._paramsReady);
        for(var iPR in this._paramsReady) {
            paramsOk = paramsOk && this._paramsReady[iPR];
            paramsReadyLength++;
        }

        Logger.debug("sourceReady");
        Logger.debug(this._sourceReady);
        Logger.debug("paramsOk");
        Logger.debug(paramsOk);
        Logger.debug("paramsReady");
        Logger.debug(this._paramsReady);
        Logger.debug("paramsReady.length");
        Logger.debug(paramsReadyLength);
        Logger.debug("paramsLength");
        Logger.debug(this._paramsLength);

        if(this._sourceReady && paramsOk && (paramsReadyLength == this._paramsLength || this._paramsLength == 0)) {

            for (var iParamTypes in this._sourceParamTypesDescription) {
                var paramTypeDescription = this._sourceParamTypesDescription[iParamTypes];
                if(typeof(paramTypeDescription.name) != "undefined") {
                    if(typeof(this._params[paramTypeDescription.name]) == "undefined") {
                        Logger.error("Error --> A value for paramType is missing...");
                        //TODO : Error --> A value for paramType is missing...
                    }
                }
            }

            Logger.debug('Connection to source : ' + 'http://' + this._sourceHost + ':' + this._sourcePort + '/' + this._sourceService);
            Logger.debug(self._params);
            this._callSocket = socketIOClient('http://' + this._sourceHost + ':' + this._sourcePort + '/' + this._sourceService);
            this._callSocket.on("connect", function () {
                Logger.info("Connected to Service.");
                self._callSocket.emit(self._sourceName, self._params);
                Logger.debug("Call to Source : " + self._sourceName + " with params : ");
                Logger.debug(self._params);
            });

            this._callSocket.on("newInfos", function (newInfos) {
                Logger.info("Received new infos.");
                Logger.debug(newInfos);
                self._zoneSocket.emit("zones/" + self._zoneId + "/calls/" + self._callId, newInfos);
                Logger.debug("Send new Infos to Zone : zones/" + self._zoneId + "/calls/" + self._callId);
            });

            this._callSocket.on("error", function (errorData) {
                Logger.error("An error occurred during connection to Service.");
                Logger.debug(errorData);
            });

            this._callSocket.on("disconnect", function () {
                Logger.info("Disconnected to Service.");
            });

            this._callSocket.on("reconnect", function (attemptNumber) {
                Logger.info("Connected to Service after " + attemptNumber + " attempts.");
            });

            this._callSocket.on("reconnect_attempt", function () {
                Logger.info("Reconnect attempt to Service.");
            });

            this._callSocket.on("reconnecting", function (attemptNumber) {
                Logger.info("Trying to connect to Service - Attempt number " + attemptNumber + ".");
            });

            this._callSocket.on("reconnect_error", function (errorData) {
                Logger.error("An error occurred during reconnection to Service.");
                Logger.debug(errorData);
            });

            this._callSocket.on("reconnect_failed", function () {
                Logger.error("Failed to connect to Service. No new attempt will be done.");
            });
        }
    }
}