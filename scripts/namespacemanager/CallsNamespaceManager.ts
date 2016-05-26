/**
 * @author Christian Brel <christian@the6thscreen.fr, ch.brel@gmail.com>
 */

/// <reference path="../../t6s-core/core-backend/scripts/Logger.ts" />
    /// <reference path="../../t6s-core/core-backend/scripts/ForEachAsync.ts" />

/// <reference path="../../t6s-core/core-backend/scripts/server/NamespaceManager.ts" />

/// <reference path="../../libsdef/socket.io-client.d.ts" />

var socketIOClient = require('socket.io-client');

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
     * Call's SDI id
     *
     * @property _sdiId
     * @private
     * @type number
     */
    private _sdiId : number;

    /**
     * Call's Profil Id
     *
     * @property _profilId
     * @private
     * @type number
     */
    private _profilId : number;

    /**
     * Call's Profil hash
     *
     * @property _hashProfil
     * @private
     * @type string
     */
    private _hashProfil : string;

    /**
     * Call's Client IP
     *
     * @property _clientIP
     * @private
     * @type string
     */
    private _clientIP : string;

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


    ///////////// Variables to manage process connection with Sources Server and Source ///////////

    /**
     * Call description.
     *
     * @property _callDescription
     * @type any
     */
    private _callDescription : any;

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

        this._callId = null;

        this._callDescription = null;

		this._params = new Object();

        this._sourceConnectionDescription = null;


		this._listeningFromClient();
    }

	/**
	 * Step 0 : Listen from Client.
	 *
	 * @method _listeningFromClient
	 * @private
	 */
	private _listeningFromClient() {
		Logger.debug("Step 0 : _listeningFromClient");
		var self = this;

		this.addListenerToSocket('callId', function(callIdDescription) { self._processCallId(callIdDescription); });
	}

    /**
     * Step 1.0 : Process Call Id.
     *
     * @method processCallId
	 * @private
     * @param {any} callIdDescription - The callId.
     */
    private _processCallId(callIdDescription : any) {
        Logger.debug("Step 1.0 : callIdDescription : " + JSON.stringify(callIdDescription));
        //callId - The new call description : {id : number}

		var self = this;

        self._callId = callIdDescription.id;
        self._sdiId = callIdDescription.sdiId;
        self._profilId = callIdDescription.profilId;
        self._hashProfil = callIdDescription.hashProfil;
        self._clientIP = this.getIP();

        Logger.debug("IP retrieved: "+self._clientIP);

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

		var backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';

        try {
            this._backendSocket = socketIOClient(backendUrl + '/sources',
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
            Logger.error("Error : An error occurred during connection to Backend.");
            Logger.debug(errorData);
        });

        this._backendSocket.on("disconnect", function() {
            Logger.info("Disconnected from Backend.");
        });

        this._backendSocket.on("reconnect", function(attemptNumber) {
            Logger.info("Connected to Backend after " + attemptNumber + " attempts.");
			self._manageBackendConnection();
        });

        this._backendSocket.on("reconnect_attempt", function() {
            Logger.info("Trying to reconnect to Backend.");
        });

        this._backendSocket.on("reconnecting", function(attemptNumber) {
            Logger.info("Trying to connect to Backend - Attempt number " + attemptNumber + ".");
        });

        this._backendSocket.on("reconnect_error", function(errorData) {
            Logger.error("Reconnect Error : An error occurred during reconnection to Backend.");
            Logger.debug(errorData);
        });

        this._backendSocket.on("reconnect_failed", function() {
            Logger.error("Failed to connect to Backend. New attempt will be done in 5 seconds. Administrators received an Alert !");
            //TODO: Send an email and Notification to Admins !

			setTimeout(function() {
				self._backendSocket = null;
				self._connectToBackend();
			}, 5000);
        });
    }

	/**
	 * Disconnection from Backend.
	 *
	 * @method _disconnectFromBackend
	 * @private
	 */
	private _disconnectFromBackend() {
		if(typeof(this._backendSocket) != "undefined" && this._backendSocket != null) {
			//Disconnection from Backend
			this._backendSocket.disconnect();
			this._backendSocket = null;
		} // else // Nothing to do...
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
            this._disconnectFromBackend();
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

		this._disconnectFromBackend();

		this._connectToSource();
    }

    /**
     * Step 4.1 : Connection to Source.
     *
     * @method _connectToSource
     * @private
     */
    private _connectToSource() {
        Logger.debug("Step 4.1 : _connectToSource");
        var self = this;

		self._params = new Object();

		self._callDescription.paramValues.forEach(function(paramValueDescription) {
			self._params[paramValueDescription.paramType.name] = paramValueDescription.value;
		});

		var paramValuesOk = true;

		self._callDescription.callType.source.paramTypes.forEach(function(paramTypeDescription) {
			if(typeof(self._params[paramTypeDescription.name]) == "undefined") {
				paramValuesOk = false;
			}
		});

        self._params["serviceLogo"] = self._callDescription.callType.source.service.logo;
        self._params["serviceName"] = self._callDescription.callType.source.service.name;

        self._params["SDI"] = {
            "id": self._sdiId,
            "profilId" : self._profilId,
            "hash": self._hashProfil
        };

        self._params["ClientIP"] = self._clientIP;

		if(! paramValuesOk) {
			Logger.error("Error --> A value for paramType is missing...");
			self._sendErrorToClient(new Error("Fail to connect to Source because a value for a ParamType is missing."));
			//TODO : Error --> A value for paramType is missing...
			return;
		}

		try {
			this._sourceSocket = socketIOClient(this._callDescription.callType.source.service.host,
				{"reconnection" : true, 'reconnectionAttempts' : 10, "reconnectionDelay" : 1000, "reconnectionDelayMax" : 5000, "timeout" : 5000, "autoConnect" : true, "multiplex": false});

		} catch(e) {
			Logger.error("Connect To Source error");
			Logger.error(e.message);
			self._sendErrorToClient(e);
		}

		this._listeningFromSource();

		this._sourceSocket.on("connect", function () {
			Logger.info("Connected to Source.");
			self._manageSourceConnection();
		});

		this._sourceSocket.on("error", function (errorData) {
			Logger.error("An error occurred during connection to Source.");
		});

		this._sourceSocket.on("disconnect", function () {
			Logger.info("Disconnected to Source.");
		});

		this._sourceSocket.on("reconnect", function (attemptNumber) {
			Logger.info("Connected to Source after " + attemptNumber + " attempts.");
			self._manageSourceConnection();
		});

		this._sourceSocket.on("reconnect_attempt", function () {
			Logger.info("Reconnect attempt to Source.");
		});

		this._sourceSocket.on("reconnecting", function (attemptNumber) {
			Logger.info("Trying to connect to Source - Attempt number " + attemptNumber + ".");
		});

		this._sourceSocket.on("reconnect_error", function (errorData) {
			Logger.error("An error occurred during reconnection to Source.");
		});

		this._sourceSocket.on("reconnect_failed", function () {
			Logger.error("Failed to connect to Source. New attempt will be done in 5 seconds. Administrators received an Alert !");
			//TODO: Send an email and Notification to Admins !

			setTimeout(function() {
				self._sourceSocket = null;
				self._connectToSource();
			}, 5000);
		});
    }

	/**
	 * Disconnection from Source.
	 *
	 * @method _disconnectFromSource
	 * @private
	 */
	private _disconnectFromSource() {
		if(typeof(this._sourceSocket) != "undefined" && this._sourceSocket != null) {
			//Disconnection from Source
			this._sourceSocket.disconnect();
			this._sourceSocket = null;
		} // else // Nothing to do...
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

			if (this._callDescription.callType.source.service.oauth) {
                if (this._callDescription.oAuthKey != null) {
                    completeParams["oauthKey"] = this._callDescription.oAuthKey.value;
                } else {
                    Logger.error("An oAuthKey parameter should be assigned to the following call: "+this._callDescription.id);
                    Logger.debug("Associated service: "+this._callDescription.callType.source.service.name);
                }

			}

			completeParams["refreshTime"] = this._callDescription.callType.source.refreshTime;

			this._sourceSocket.emit(this._callDescription.callType.source.method, completeParams);
		} else {
			this._disconnectFromSource();
		}
    }

    /**
     * Step 4.2 : Listen from Source answers.
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
                sourceConnectionDescription["url"] = self._callDescription.callType.source.service.host;
                sourceConnectionDescription["hash"] = connectionHash.hash;

                self._sourceConnectionDescription = sourceConnectionDescription;

				self._disconnectFromSource();

                self._sendSourceConnectionDescription();
            }, function(error) {
                Logger.error(error);
                self._sendErrorToClient(error);
            });

        });
    }

    /**
     * Step 4.3 : Send Source Connection Description to Client.
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
		this._disconnectFromBackend();

		this._disconnectFromSource();
    }
}