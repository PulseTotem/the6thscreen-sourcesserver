/**
 * @author Christian Brel <christian@the6thscreen.fr, ch.brel@gmail.com>
 */

/// <reference path="../../t6s-core/core-backend/scripts/Logger.ts" />
    /// <reference path="../../t6s-core/core-backend/scripts/ForEachAsync.ts" />

/// <reference path="../../t6s-core/core-backend/scripts/server/NamespaceManager.ts" />

class CallsNamespaceManager extends NamespaceManager {

    /**
     * Call's id.
     *
     * @property _callId
     * @private
     * @type number
     */
    private _callId: number;

	/**
	 * User's id.
	 *
	 * @property _userId
	 * @private
	 * @type number
	 */
	private _userId: number;

    /**
     * Backend socket.
     *
     * @property _backendSocket
     * @private
     * @type any
     */
    private _backendSocket: any;

    /**
     * Source socket.
     *
     * @property _sourceSocket
     * @private
     * @type any
     */
    private _sourceSocket: any;

    /**
     * Call params.
     *
     * @property _params
     * @private
     * @type Object
     */
    private _params : Object;

	/**
	 * OAuthKey param.
	 *
	 * @property _oauthKeyValue
	 * @private
	 * @type string
	 */
	private _oauthKeyValue : string;

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
    private _serviceHost : string;

    /**
     * Source name.
     *
     * @property _sourceName
     * @private
     * @type string
     */
    private _sourceMethod : string;

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


    ///////////// Variables to manage process connection with Sources Server and Source ///////////

    /**
     * Call description.
     *
     * @property _callDescription
     * @type any
     */
    private _callDescription : any;

    /**
     * CallType description.
     *
     * @property _callTypeDescription
     * @type any
     */
    private _callTypeDescription : any;

    /**
     * Source description.
     *
     * @property _sourceDescription
     * @type any
     */
    private _sourceDescription : any;

	/**
	 * OAuthKey description.
	 *
	 * @property _oauthKeyDescription
	 * @type any
	 */
	private _oauthKeyDescription : any;

    /**
     * Source Connection description (host and hash).
     *
     * @property _sourceConnectionDescription
     * @type any
     */
    private _sourceConnectionDescription : any;

    /**
     * Constructor.
     *
     * @constructor
     * @param {any} socket - The socket.
     */
    constructor(socket : any) {
        super(socket);

        this._params = new Object();
		this._oauthKeyValue = null;
        this._callId = null;
		this._userId = null;
        this._paramsLength = 0;
        this._sourceReady = false;
        this._paramsReady = new Object();

        this._callDescription = null;
        this._callTypeDescription = null;
        this._sourceDescription = null;
		this._oauthKeyDescription = null;

        this._sourceConnectionDescription = null;

        this.addListenerToSocket('callId', this.processCallId);
    }

    /**
     * Step 1.0 : Process Call Id.
     *
     * @method processCallId
     * @param {any} callIdDescription - The callId.
     * @param {CallsNamespaceManager} self - The CallsNamespaceManager instance.
     */
    processCallId(callIdDescription : any, self : CallsNamespaceManager = null) {
        Logger.debug("Step 1.0 : callIdDescription : " + JSON.stringify(callIdDescription));
        //callId - The new call description : {id : number, userId : number}

        if(self == null) {
            self = this;
        }

        self._callId = callIdDescription.id;
		self._userId = callIdDescription.userId;

        self._connectToBackend();
    }

    /**
     * Step 2.1 : Connection to Backend.
     *
     * @method _connectToBackend
     * @private
     */
    private _connectToBackend() {
        Logger.debug("Step 2.1 : _connectToBackend");
        var self = this;

        try {

            this._backendSocket = socketIOClient('http://localhost:4000/sources',
                {"reconnection": true, "reconnectionDelay": 1000, "reconnectionDelayMax": 5000, "timeout": 10000, "autoConnect": true, "reconnectionAttempts": 10, "multiplex": false});

        } catch(e) {
            Logger.error("_connectToBackend error");
            Logger.error(e.message);
            self._sendErrorToClient(e);
        }
        this._listeningFromBackend();

        this._backendSocket.on("connect", function() {
            Logger.info("Connected to Backend.");
            self._manageBackendConnection();
        });

        this._backendSocket.on("error", function(errorData) {
            Logger.error("An error occurred during connection to Backend.");
            Logger.debug(errorData);
        });

        this._backendSocket.on("disconnect", function() {
            Logger.info("Disconnected from Backend.");
        });

        this._backendSocket.on("reconnect", function(attemptNumber) {
            Logger.info("Connected to Backend after " + attemptNumber + " attempts.");
        });

        this._backendSocket.on("reconnect_attempt", function() {
            Logger.info("Trying to reconnect to Backend.");
        });

        this._backendSocket.on("reconnecting", function(attemptNumber) {
            Logger.info("Trying to connect to Backend - Attempt number " + attemptNumber + ".");
        });

        this._backendSocket.on("reconnect_error", function(errorData) {
            Logger.error("An error occurred during reconnection to Backend.");
            Logger.debug(errorData);
        });

        this._backendSocket.on("reconnect_failed", function() {
            Logger.error("Failed to connect to Backend. No new attempt will be done.");
            self._sendErrorToClient(new Error("Fail to connect to Backend."));
        });

        this._backendSocket.on("message", function(msg) {
            Logger.info("Received new message from backend.");
            Logger.debug(msg);
        });
    }

    /**
     * Step 2.2 : Listen from Backend answers.
     *
     * @method _listeningFromBackend
     * @private
     */
    private _listeningFromBackend() {
        Logger.debug("Step 2.2 : _listeningFromBackend");
        var self = this;

        this._backendSocket.on("CallDescription", function(response) {
            self.manageServerResponse(response, function(callDescription) {
                self.callDescriptionProcess(callDescription);
            }, function(error) {
                Logger.error(error);
                self._sendErrorToClient(error);
            });
        });

        this._backendSocket.on("CallTypeDescription", function(response) {
            self.manageServerResponse(response, function(callTypeDescription) {
                self.callTypeDescriptionProcess(callTypeDescription);
            }, function(error) {
                Logger.error(error);
                self._sendErrorToClient(error);
            });
        });

        this._backendSocket.on("SourceDescription", function(response) {
            self.manageServerResponse(response, function(sourceDescription) {
                self.sourceDescriptionProcess(sourceDescription);
            }, function(error) {
                Logger.error(error);
                self._sendErrorToClient(error);
            });
        });

        this._backendSocket.on("ParamValueDescription", function(response) {
            self.manageServerResponse(response, function(paramValueDescription) {
                self.paramValueDescriptionProcess(paramValueDescription);
            }, function(error) {
                Logger.error(error);
                self._sendErrorToClient(error);
            });
        });

		this._backendSocket.on("OAuthKeyDescription", function(response) {
			self.manageServerResponse(response, function(oauthkeyDescription) {
				self.oauthKeyDescriptionProcess(oauthkeyDescription);
			}, function(error) {
				Logger.error(error);
				self._sendErrorToClient(error);
			});
		});
    }

    /**
     * Step 2.3 : Manage backend connection.
     *
     * @method _manageBackendConnection
     * @private
     */
    private _manageBackendConnection() {
        Logger.debug("Step 2.3 : _manageBackendConnection");
        if(this._callDescription == null) {
            this._retrieveCallDescription();
        } else { // Step 3.1 : done.
            if(this._callTypeDescription == null) {
                this._retrieveCallTypeDescription();
            } else { // Step 4.1.1 : done
                if(this._sourceDescription == null) {
                    this._retrieveSourceDescription();
                } else { // Step 4.1.3 : done
					if(this._sourceDescription.service.oauth && this._oauthKeyDescription == null) {
						this._retrieveOAuthKey();
					} // else // Step 4.1.5 : done
				}
            }

            for(var iParamReady in this._paramsReady) {
                if(! this._paramsReady[iParamReady]) {
                    this._retrieveParamValueDescription(iParamReady);
                } // else // Step 4.2.1 : done
            }
        }
    }

    /**
     * Step 3.1 : Retrieve Call Description.
     *
     * @method _retrieveCallDescription
     * @private
     */
    private _retrieveCallDescription() {
        Logger.debug("Step 3.1 : _retrieveCallDescription");
        this._backendSocket.emit("RetrieveCallDescription", {"callId": this._callId});
    }

    /**
     * Step 3.2 : Process the Call Description
     *
     * @method callDescriptionProcess
     * @param {JSON Object} callDescription - The call's description to process
     */
    private callDescriptionProcess(callDescription : any) {
        this._callDescription = callDescription;
        Logger.debug("Step 3.2 : callDescriptionProcess");
        var self = this;

        this._retrieveCallTypeDescription();

        if(typeof(callDescription.paramValues) != "undefined") {
            this._paramsLength = callDescription.paramValues.length;
            ForEachAsync.forEach(callDescription.paramValues, function(iParamValue) {
                var paramValue = callDescription.paramValues[iParamValue];
                var paramValueId = paramValue["id"];

                if(typeof(self._paramsReady[paramValueId]) == "undefined") {
                    self._paramsReady[paramValueId] = false;

                    self._retrieveParamValueDescription(paramValueId);
                }
            });
        }
    }

    /**
     * Step 4.1.1 : Retrieve the CallType Description
     *
     * @method _retrieveCallTypeDescription
     * @private
     */
    private _retrieveCallTypeDescription() {
        Logger.debug("Step 4.1.1 : _retrieveCallTypeDescription");
        if(typeof(this._callDescription.callType) != "undefined") {
            var callTypeId = this._callDescription.callType["id"];

            this._backendSocket.emit("RetrieveCallTypeDescription", {"callTypeId" : callTypeId});
        }
    }

    /**
     * Step 4.1.2 : Process the CallType Description
     *
     * @method callTypeDescriptionProcess
     * @param {JSON Object} callTypeDescription - The callType's description to process
     */
    callTypeDescriptionProcess(callTypeDescription : any) {
        this._callTypeDescription = callTypeDescription;
        var self = this;

        Logger.debug("Step 4.1.2 : callTypeDescriptionProcess");

        this._retrieveSourceDescription();
    }

    /**
     * Step 4.1.3 : Retrieve the Source Description
     *
     * @method _retrieveSourceDescription
     * @private
     */
    private _retrieveSourceDescription() {
        Logger.debug("Step 4.1.3 : _retrieveSourceDescription");
        if(typeof(this._callTypeDescription.source) != "undefined") {
            var sourceId = this._callTypeDescription.source["id"];

            this._backendSocket.emit("RetrieveSourceDescription", {"sourceId" : sourceId});
        }
    }

    /**
     * Step 4.1.4 : Process the Source Description
     *
     * @method sourceDescriptionProcess
     * @param {JSON Object} sourceDescription - The source's description to process
     */
    sourceDescriptionProcess(sourceDescription : any) {
        this._sourceDescription = sourceDescription;
        var self = this;

        Logger.debug("Step 4.1.4 : sourceDescriptionProcess");

        if(typeof(sourceDescription.paramTypes) != "undefined") {
            this._sourceParamTypesDescription = sourceDescription.paramTypes;
        }

        if(typeof(sourceDescription.service) != "undefined" && typeof(sourceDescription.method) != "undefined") {
            this._serviceHost = sourceDescription.service.host;
            this._sourceMethod = sourceDescription.method;

            this._sourceReady = true;

			if(sourceDescription.service.oauth) {
				this._retrieveOAuthKey();
			}

            this._connectToSource();
        }
    }

	/**
	 * Step 4.1.5 : Retrieve the OAuthKey Description
	 *
	 * @method _retrieveOAuthKey
	 * @private
	 */
	private _retrieveOAuthKey() {
		Logger.debug("Step 4.1.5 : _retrieveOAuthKey");

		this._backendSocket.emit("RetrieveOAuthKeyDescription", {"userId" : this._userId, "serviceId" : this._sourceDescription.service.id});
	}

	/**
	 * Step 4.1.6 : Process the OAuthKey Description
	 *
	 * @method oauthKeyDescriptionProcess
	 * @param {JSON Object} oauthKeyDescription - The oauthKey's description to process
	 */
	oauthKeyDescriptionProcess(oauthKeyDescription : any) {
		this._oauthKeyDescription = oauthKeyDescription;
		var self = this;

		Logger.debug("Step 4.1.6 : sourceDescriptionProcess");

		if(typeof(oauthKeyDescription.value) != "undefined") {
			this._oauthKeyValue = oauthKeyDescription.value;

			this._connectToSource();
		}
	}

    /**
     * Step 4.2.1 : Retrieve the ParamValue Description
     *
     * @method _retrieveParamValueDescription
     * @private
     * @param {number} paramValueId - The ParamValue's Id to retrieve.
     */
    private _retrieveParamValueDescription(paramValueId : number) {
        Logger.debug("Step 4.2.1 : _retrieveParamValueDescription");

        this._backendSocket.emit("RetrieveParamValueDescription", {"paramValueId": paramValueId});
    }

    /**
     * Step 4.2.2 : Process the ParamValue Description
     *
     * @method paramValueDescriptionProcess
     * @param {JSON Object} paramValueDescription - The paramValue's description to process
     * @param {string} value - The paramValue's value
     */
    paramValueDescriptionProcess(paramValueDescription : any) {
        Logger.debug("Step 4.2.2 : paramValueDescriptionProcess");

        if(typeof(paramValueDescription.paramType) != "undefined" && typeof(paramValueDescription.paramType.name) != "undefined"  && typeof(paramValueDescription.value) != "undefined") {
            this._params[paramValueDescription.paramType.name] = paramValueDescription.value;

            this._paramsReady[paramValueDescription.id] = true;

            this._connectToSource();
        }
    }

    /**
     * Step 5.1 : Connection to Source.
     *
     * @method _connectToSource
     * @private
     */
    private _connectToSource() {
        Logger.debug("Step 5.1 : _connectToSource");
        var self = this;

        var paramsOk = true;
        var paramsReadyLength = 0;

        for(var iPR in this._paramsReady) {
            paramsOk = paramsOk && this._paramsReady[iPR];
            paramsReadyLength++;
        }

		var oauthKeyOk = false;
		if(this._sourceReady && this._sourceDescription.service.oauth) {
			if(this._oauthKeyValue != null) {
				oauthKeyOk = true;
			}
		} else {
			oauthKeyOk = true;
		}

        if(this._sourceReady && paramsOk && (paramsReadyLength == this._paramsLength || this._paramsLength == 0) && oauthKeyOk) {

            for (var iParamTypes in this._sourceParamTypesDescription) {
                var paramTypeDescription = this._sourceParamTypesDescription[iParamTypes];
                if(typeof(paramTypeDescription.name) != "undefined") {
                    if(typeof(this._params[paramTypeDescription.name]) == "undefined") {
                        Logger.error("Error --> A value for paramType is missing...");
                        self._sendErrorToClient(new Error("Fail to connect to Service because a value for a ParamType is missing."));
                        //TODO : Error --> A value for paramType is missing...
                    }
                }
            }

            this._sourceSocket = socketIOClient(this._serviceHost,
                {"reconnection" : true, 'reconnectionAttempts' : 10, "reconnectionDelay" : 1000, "reconnectionDelayMax" : 5000, "timeout" : 5000, "autoConnect" : true, "multiplex": false});
            this._listeningFromSource();
            this._sourceSocket.on("connect", function () {
                Logger.info("Connected to Service.");
                self._manageSourceConnection();
            });

            this._sourceSocket.on("error", function (errorData) {
                Logger.error("An error occurred during connection to Service.");
            });

            this._sourceSocket.on("disconnect", function () {
                Logger.info("Disconnected to Service.");
            });

            this._sourceSocket.on("reconnect", function (attemptNumber) {
                Logger.info("Connected to Service after " + attemptNumber + " attempts.");
            });

            this._sourceSocket.on("reconnect_attempt", function () {
                Logger.info("Reconnect attempt to Service.");
            });

            this._sourceSocket.on("reconnecting", function (attemptNumber) {
                Logger.info("Trying to connect to Service - Attempt number " + attemptNumber + ".");
            });

            this._sourceSocket.on("reconnect_error", function (errorData) {
                Logger.error("An error occurred during reconnection to Service.");
            });

            this._sourceSocket.on("reconnect_failed", function () {
                Logger.error("Failed to connect to Service. No new attempt will be done.");
                self._sendErrorToClient(new Error("Fail to connect to Service."));
            });
        }
    }

    /**
     * Manage connection to Source.
     *
     * @method _manageSourceConnection
     * @private
     */
    private _manageSourceConnection() {
        if(this._sourceConnectionDescription == null) {
			var completeParams = this._params;

			if(this._sourceDescription.service.oauth) {
				completeParams["oauthKey"] = this._oauthKeyValue;
			}

            this._sourceSocket.emit(this._sourceMethod, completeParams);
        } // else // Step 5.2 and 5.3 : done.
    }

    /**
     * Step 5.2 : Listen from Source answers.
     *
     * @method _listeningFromSource
     * @private
     */
    private _listeningFromSource() {
        Logger.debug("Step 5.2 : _listeningFromSource");
        var self = this;

        this._sourceSocket.on("connectionHash", function (response) {
            self.manageServerResponse(response, function(connectionHash) {
                Logger.info("Received connection hash. => " + connectionHash.hash);

                var sourceConnectionDescription = new Object();
                sourceConnectionDescription["url"] = self._serviceHost;
                sourceConnectionDescription["hash"] = connectionHash.hash;

                self._sourceConnectionDescription = sourceConnectionDescription;

                self._sendSourceConnectionDescription();
            }, function(error) {
                Logger.error(error);
                self._sendErrorToClient(error);
            });

        });
    }

    /**
     * Step 5.3 : Send Source Connection Description to Client.
     *
     * @method _sendSourceConnectionDescription
     * @private
     */
    private _sendSourceConnectionDescription() {
        this.socket.emit("sourceConnectionDescription", this.formatResponse(true, this._sourceConnectionDescription));
    }

    /**
     * Send Error to Client.
     *
     * @method _sendErrorToClient
     * @private
     */
    private _sendErrorToClient(error : any) {
        this.socket.emit("sourceConnectionDescription", this.formatResponse(false, error));
    }

    /**
     * Method called when socket is disconnected.
     *
     * @method onDisconnection
     */
    onDisconnection() {
        //Disconnection from Backend
        this._backendSocket.disconnect();
        //Disconnection from Source
        this._sourceSocket.disconnect();
    }
}