/**
 * App SDK Plugin - AMC Customization
 * Copyright (C) 2016, The Nielsen Company (US) LLC. All Rights Reserved.
 *
 * Software contains the Confidential Information of Nielsen and is subject to your relevant agreements with Nielsen.
 */
$pdk.ns("$pdk.plugin.NielsenSDK");
    var DEBUG_VERSION = false;
    var PLUGIN_NAME = "TP Plugin";
    var PLUGIN_VERSION = "5.1.0.10"; // The last internal version is "5.1.0.10.6"
    var PREFIX = "PLUGIN ";
    var PLUGIN_NAME_SHORT = "TP";
    var PLUGIN_NAME_VERSION = PLUGIN_NAME_SHORT + "-" + PLUGIN_VERSION;
    var LDRPARAM_PLUGIN_VERSION = "nol_plugv";
    var LDRPARAM_PLAYER_VERSION = "nol_playerv";
    var LDRPARAM_OVERRIDE = "nol_override";
    var INFINITY_VALUE = 86400;
    
    var META_LENGTH = "length";
    var META_LENGTH_DEFAULT_VALUE = 0;

    var _nextInstance;
    
    function merge_objects(obj1, obj2) {
            var obj3 = {};
            try {
                if (typeof obj1 === "object" && obj1 !== null) {
                    for ( var attrname in obj1) {
                            if (typeof obj1[attrname] != 'undefined') obj3[attrname] = obj1[attrname];
                    }
                }
                if (typeof obj2 === "object" && obj2 !== null) {
                    for ( var attrname in obj2) {
                            if (typeof obj2[attrname] != 'undefined') obj3[attrname] = obj2[attrname];
                    }
                }
            }
            catch(e) {
            }
            return obj3;
    }

$pdk.plugin.NielsenSDK = $pdk.extend(function () {},
        {

            ldrparams: {},
            gg1: null,
            cmsDefaults: null,
            custom_fields: null,
            glblVar: {
                _deb: 0, // write debug log
                debug: null,
                _useAltAd: 0, // use the _experience module to listen to Ad events (used by Panache)
                _isOverlay: false,
                _currAdwp: 0, // state of what's currently showing, values are 0-notstarted, 1-playing, 2-paused, 3-stopped
                _currContwp: 0,
                _currvt: 0, // video currently playing,  0-content, 1-ad
                _currAdID: '', // url/id of what's currently playing
                _currContID: '',
                _currAdDur: 0, // duration of current ad (needed for generating stop and unload events)
                _currContDur: 0, // duration of current content video
                _sbf: 0, // Was a segment break forced because of AD/Chapter cuepoints? If so, need to issue a 3 or 15 next time
                _proccp: 3, // Cuepoint Processing, 0-none, 1-ad cues only, 2-chapter cues only, 3-ad and chapter cues
                _metamod: 0, // category and subcategory modifier. If 1, will add "Full" or "Clip" to category or subcategory
                _sstrpend: 0,
                _atCuePoint: 0, // 1 iff there was a ad cue point from last content
                _videoLoadTS: 0,
                _startBufTS: 0,
                _last49Progress: -1,
                lastPlayerPosExact: -1,
                _timeInc: 1,
                _lastAbsProgress: 0,
                _lastAdProgress: 0,
                _contType: "",
                _ou: "",
                _cues: [],
                _curSeg: 0,
                _defaultOU: {url: '', state: ""},
                _addrProtocol: window.location.protocol || "http:",
                _contStarted: false,
                _adStarted: false,
                _adOrContent: "ad", // what's playing now
                _releaseUrl: "",
                _lastProgress: 0,
                _lastMedia: null, // last media played; content or ad
                _adType: null, // used to calculate postroll
                _chaptersLength: 0, // used to compare chapters length from release event
                _iag_preroll_vi: {},
                _playlist: "",
                _currentChapter: 0,
                _currentRetry: 0,
                _maxRetry: 5,
                viCont: {},
                viAd: {},
                contLengthSent: null,
                ggCount: 0,
                lastLogString: "",
                nLogString: 0,
                event15_fired: false,
                event3_fired: false,
                arId3: [],
                hasMeta: false,
                contentID: null,
                isLive: null,
                customLength: null,
                contLength: null,
                instName: ""
            },

            initSdkInstance: function(params) {
                if (typeof params !== "undefined" && params !== null) {
                    var p = {};
                    for(var i in params) {
                        if (i === LDRPARAM_PLUGIN_VERSION || i === LDRPARAM_PLAYER_VERSION) {
                            if (!p.hasOwnProperty(LDRPARAM_OVERRIDE)) p[LDRPARAM_OVERRIDE] = {};
                            p[LDRPARAM_OVERRIDE][i] = encodeURIComponent(params[i]);
                            delete params[i];
                        }
                    }
                    for (var i in this.sdkParams) {
                        if (i === "nol_sdkDebug" || i === "sfcode" || i === "apn") {
                            if (typeof this.sdkParams[i] === "string") {
                                if (!this.sdkParams.hasOwnProperty("sdkOptParams")) this.sdkParams["sdkOptParams"] = {};
                                this.sdkParams["sdkOptParams"][i] = this.sdkParams[i];
                                delete this.sdkParams[i];
                            }
                        }
                    }

                    this.sdkParams["sdkOptParams"] = merge_objects(this.sdkParams["sdkOptParams"], p);
                    this.sdkParams["sdkOptParams"] = merge_objects(this.sdkParams["sdkOptParams"], params);
                }

        try {
                    if (this.sdkParams.hasOwnProperty("instanceName")) {
                        this.instName = this.sdkParams["instanceName"];
                    } else {
                        this.instName = _nextInstance.toString();
                    }
                    
                    if (typeof window.NOLBUNDLE !== "undefined" && typeof window.NOLBUNDLE.nlsQ === "function") {
                        this.log("Getting BSDK instance '" + this.instName + "' with params=" + this.printObject(this.sdkParams, null, 2));
                        this.gg1 = window.NOLBUNDLE.nlsQ(this.sdkParams["apid"], this.instName, this.sdkParams["sdkOptParams"]);
                    } else {
                        this.log("ERROR: BSDK snippet is not loaded. Cannot get the BSDK instance");
                        this.gg1 = null;
                    }
                    _nextInstance++;
        }
        catch(e) {
                        this.gg1 = null;
            this.log("Error in loading SDK: " + e.message);
        }
            },

            log: function (obj)
            {
                try {
                    if (this.glblVar.debug) {
                        if (this.glblVar.lastLogString == obj)
                            this.glblVar.nLogString++;
                        else
                            this.glblVar.nLogString = 0;
                        var pluginName = " " + this.instName + ", ";
                        this.glblVar.debug.log((this.glblVar.nLogString != 0 ? (this.glblVar.nLogString + " ") : "") + PREFIX + pluginName + ": " + obj);
                        this.glblVar.lastLogString = obj;
                    }
                } catch (e) {
                }
            },

            //Method calls first
            initialize: function (loadObj) {
                try {
/*
                    ldrparams =
                    {
                        apid: "xxx",
                        instanceName: "my_player_1",    // [opt]
                        nol_sdkDebug: "debug", // [opt]
                        sdkOptParams: { // [opt]
                            x1: "y1",
                            x2: "y2"
                            },
                        nol_pluginDebug: "debug",   // [opt]
                        ncstm12345: "zzz",   // [opt]
                        tv: true,      // [opt] - instead of "defaults"
                        defaults: { tv: true }      // [opt]
                    }
 */
                    if (loadObj === null || typeof loadObj === "undefined")
                        return;
                    var me = this;
                    this._controller = loadObj.controller;
                    me._lo = loadObj;
                    
                    if (typeof _nextInstance === "undefined") _nextInstance = Math.round(Math.random() * 10000)*10000;
    
                    if (loadObj.vars !== null && typeof loadObj.vars !== "undefined") {
                        for (var i in loadObj.vars) {
                            me.ldrparams[i] = loadObj.vars[i];
                        }
                    }

                    var nol_pluginDebug = null;
                    if (me.ldrparams.hasOwnProperty("nol_pluginDebug") && typeof me.ldrparams.nol_pluginDebug === "string") {
                            nol_pluginDebug = me.ldrparams.nol_pluginDebug.toLowerCase();
                    }

                    this.glblVar.debug = (
                            (
                            DEBUG_VERSION ||
                            nol_pluginDebug === "true" || nol_pluginDebug === "debug" || nol_pluginDebug === "xml"
                            )
                            && window.console) || false;

                    if (me.glblVar.debug) me.log("ldrparams: " + me.printObject(me.ldrparams));
                    
                    if (me.ldrparams.hasOwnProperty("nol_pluginDebug")) {
                            delete me.ldrparams.nol_pluginDebug;
                    }

                    me.sdkParams = {};
                    me.sdkParams["sdkOptParams"] = {};
                    for (var s in me.ldrparams) {
                        var isSdkParam =
                                s === "apid" ||
                                s === "sdkOptParams" ||
                                s === "instanceName" ||
                                s === "nol_sdkDebug" ||
                                s === "sfcode" ||
                                s === "apn";
                        var isSdkParamOld =
                                s === "nsdkv";
                        if (isSdkParam && typeof me.ldrparams[s] !== "undefined" && me.ldrparams[s] !== null) {
                            me.sdkParams[s] = me.ldrparams[s];
                        }
                        if (isSdkParam || isSdkParamOld) {
                            delete me.ldrparams[s];
                        }
                    }

                    me.cmsDefaults = {};
                    
                    if (this.glblVar.debug)
                        this.log("info: Plugin=" + PLUGIN_NAME + " " + PLUGIN_VERSION);
                    
                    if (me.ldrparams.hasOwnProperty("defaults")){
                        try {
                            if (typeof me.ldrparams.defaults === "string")
                                me.cmsDefaults = JSON.parse(me.ldrparams.defaults);
                            else if (typeof me.ldrparams.defaults === "object")
                                me.cmsDefaults = me.ldrparams.defaults;
                        } catch(e) {
                            if (me.glblVar.debug) me.log("incorrect format of defaults: " + me.printObject(me.ldrparams.defaults));
                        }
                        delete me.ldrparams.defaults;
                    }

                    me.custom_fields = null;
                    /*
                     * custom_fields can be passed as an object or as a JSON string:
                     * Example of object:
                     custom_fields = { assetid: "myid", title: "mytitle" };
                     * Example of JSON string:
                     custom_fields = '{ "assetid": "myid", "title": "mytitle" }';
                     */
                
                    if (me.ldrparams.hasOwnProperty("custom_fields")) {
                        try {
                            if (typeof me.ldrparams.custom_fields === "string")
                                me.custom_fields = JSON.parse(me.ldrparams.custom_fields);
                            else if (typeof me.ldrparams.custom_fields === "object")
                                me.custom_fields = me.ldrparams.custom_fields;
                        } catch(e) {
                            if (this.glblVar.debug) this.log("incorrect format of custom_fields: " + this.printObject(me.ldrparams.custom_fields));
                        }
                        delete me.ldrparams.custom_fields;
                    }

                    // Consider all the rest parameters as defaults and move them to cmsDefaults
                    for (var s in me.ldrparams) {
                        var searchRes = s.search(/ncstm*._/);
                        if (searchRes !== 0) {
                            // Move all the rest parameters (othre than "ncstm*") to cmsDefaults,
                            // e.g. tv:true, dataSrc:"id3"
                            // These parameters should be deleted from ldrparams
                            me.cmsDefaults[s] = me.ldrparams[s];
                            delete me.ldrparams[s];
                        }
                    }
                    // At this point ldrparams contains only "ncstm*"
                    
                    if (me.glblVar.debug) me.log("the rest of ldrparams: " + me.printObject(me.ldrparams));

                    var playerVersion = "";
                    try {
                        if (typeof $pdk.version === "string") {
                                playerVersion = $pdk.version;
                            }
                        else {
    //                            playerVersion = $pdk.version.major + "." + $pdk.version.minor + "." + $pdk.version.revision + "." + $pdk.version.build + " ("  + $pdk.version.date + ")";
                            playerVersion = $pdk.version.major + "." + $pdk.version.minor + "." + $pdk.version.revision;
                        }
                    } catch(e) {}

                    var params = {};
                    params[LDRPARAM_PLAYER_VERSION] = PLUGIN_NAME_SHORT + "-" + playerVersion;
                    params[LDRPARAM_PLUGIN_VERSION] = PLUGIN_NAME_VERSION;
                    this.log("info: player version=" + playerVersion);

                    this.initSdkInstance(params);

                    // Subscribe for events only after GG (gg1) is initialized.
                    this.controller = loadObj.controller;
                    if (typeof this.controller === "object" && this.controller !== null) {
                        this.controller.addEventListener("OnMediaStart", function () {
                            me.onMediaStart.apply(me, arguments);
                        });
                        this.controller.addEventListener("OnReleaseStart", function (args) {
                            me.onReleaseStart.apply(me, arguments);
                        });
                        this.controller.addEventListener("OnMediaPlaying", function () {
                            me.onMediaPlaying.apply(me, arguments);
                        });
                        this.controller.addEventListener("OnMediaEnd", function () {
                            me.onMediaEnd.apply(me, arguments);
                            });
                        this.controller.addEventListener("OnMediaComplete", function (args) {
                            me.onMediaComplete.apply(me, arguments);
                        });
                        this.controller.addEventListener("OnReleaseEnd", function () {
                            me.onReleaseEnd.apply(me, arguments);
                        });
                        this.controller.addEventListener("OnMediaCuePoint", function () {
                            me.onMediaCuePoint.apply(me, arguments);
                        });
                    }
                } catch (e) {
                    this.log(e.message);
                }
            },

            //This is the event that fires when multi-chapter / ads start
            onReleaseStart: function (pEvent) {
                try {
                    if (this.glblVar.debug)
                        this.log("PlayerEvent ReleaseStart");
                    if (!pEvent || !pEvent.data)
                        return;

                    this.glblVar._playlist = pEvent.data;

                    this.glblVar.viCont = {};   // Initialize (clean up viCont on every new media-release)
                    this.glblVar.viAd = {};     // Initialize (clean up viAd on every new media-release)
                    this.glblVar.hasMeta = false;
                    this.glblVar.customLength = null;
                    this.glblVar.contLength = null;

                    this.glblVar._adType = null;
                    this.glblVar.arId3 = [];
                    if (!this.glblVar._playlist.chapters || !this.glblVar._playlist.chapters.chapters)
                        return;
                    this.glblVar._chaptersLength = this.glblVar._playlist.chapters.chapters.length;
                    this.glblVar._currentChapter = 0;
                    var viCont = this.glblVar.viCont;
                    var contentIndex = 0;
                    if (this.glblVar._playlist.chapters.chapters[0])
                        contentIndex = this.glblVar._playlist.chapters.chapters[0].contentIndex;
                    var clip = null;
                    if (this.glblVar._playlist.clips)
                        clip = this.glblVar._playlist.clips[contentIndex];
                    if (!clip)
                        return;

                    if (this.glblVar.debug)
                        this.log("[ReleaseStart] clip.mediaLength=" + clip.mediaLength + ", clip.length=" + clip.length +
                                ", baseClip.releaseLength=" + clip.baseClip.releaseLength + ", baseClip.trueLength=" + clip.baseClip.trueLength);
                    this.getMetadata(clip, viCont);

                    this.glblVar._last49Progress = -1;
                    this.glblVar.lastPlayerPosExact = -1;
                    // The length of the video at this point can be unknown or incorrect.
                    // The correct value will be taken in onMediaStart event and it will be sent in event 15 and 35.

                    viCont[META_LENGTH] = this.glblVar.contLength;
                    if (this.glblVar.customLength !== null)
                        viCont[META_LENGTH] = this.glblVar.customLength;
                    
                    if (this.isDCR()) {
                        if (this.gg1)
                            this.gg1.ggPM("loadMetadata", viCont);  // "3"
                        if (this.glblVar.debug)
                            this.log("SDKEvent 3 - " + this.printObject(viCont, null, 2));
                        this.glblVar.event3_fired = true;
                        this.contLengthSent = viCont[META_LENGTH];
                    } else {
                        this.glblVar.event3_fired = false;
                        if (this.glblVar.debug)
                            this.log("onReleaseStart: No custom data provided. Event 3 has not been emitted. Metadata: " + this.printObject(viCont, null, 2));
                    }
                } catch (e) {
                }
            },

            isDCR: function () {
                return this.glblVar.hasMeta;
            },
            
            openBlock: function() {
                var viCont = this.glblVar.viCont;
                var viAd = this.glblVar.viAd;

                if (this.glblVar._contType == "ad") {
                    if (this.glblVar.event15_fired == false) {
                        if (this.gg1)
                            this.gg1.ggPM("15", viAd);
                        this.glblVar.event15_fired = true;
                        if (this.glblVar.debug)
                            this.log("SDKEvent 15 - (ad) " + this.printObject(viAd, null, 2));
                    }
                }

                if (this.glblVar._contType == "content") {
                    if (this.glblVar.event15_fired == false) {
                        
                        viCont[META_LENGTH] = this.glblVar.contLength;
                        if (this.glblVar.customLength !== null)
                            viCont[META_LENGTH] = this.glblVar.customLength;
                    
                        if (this.isDCR()) {
                            if (this.gg1)
                                this.gg1.ggPM("15", viCont);
                            this.glblVar.event15_fired = true;
                            if (this.glblVar.debug)
                                this.log("SDKEvent 15 - (cont) " + this.printObject(viCont, null, 2));

                            if (this.contLengthSent != viCont[META_LENGTH]) {
                                var lenObj = {};
                                lenObj[META_LENGTH] = viCont[META_LENGTH];
                                if (this.gg1)
                                    this.gg1.ggPM("35", lenObj);
                                if (this.glblVar.debug)
                                    this.log("SDKEvent 35 - (cont) " + this.printObject(lenObj, null, 2));
                                this.contLengthSent = viCont[META_LENGTH];
                            }
                        } else {
                            this.glblVar.event15_fired = false;
//                            if (this.glblVar.debug)
//                                this.log("No custom data provided. Events 15,35 have not been emitted. Metadata: " + this.printObject(viCont, null, 2));
                        }
                    }
                }
            },

            onMediaStart: function (pEvent, args) {
                try {
                    if (this.glblVar.debug)
                        this.log("PlayerEvent MediaStart");

                    var viCont = this.glblVar.viCont;

                    this.glblVar.viAd = {};     // Initialize (clean up viAd on every ad), because there can be several ads for one release.
                    var viAd = this.glblVar.viAd;
                    
                    if (!pEvent || !pEvent.data)
                        return;
                    var clip = pEvent.data;

                    var contType = ((clip.hasOwnProperty('isAd') && clip.isAd) ||
                            (clip.hasOwnProperty("baseClip") && clip.baseClip.isAd)) ? "ad" : "content";

                    if (this.glblVar.debug)
                        this.log("[MediaStart - " + contType + "] clip.mediaLength=" + clip.mediaLength + ", clip.length=" + clip.length +
                                ", baseClip.releaseLength=" + clip.baseClip.releaseLength + ", baseClip.trueLength=" + clip.baseClip.trueLength);

                    if (this.glblVar._contType !== contType) {
                        // Media type is changed: ad -> content or content -> ad
                        if (this.glblVar.event15_fired) {
                            if (this.gg1)
                                this.gg1.ggPM("7", this.glblVar._last49Progress);
                            if (this.glblVar.debug)
                                this.log("SDKEvent 7 - " + this.glblVar._last49Progress);
                            this.glblVar.event15_fired = false;
                        }
                    }
                    this.glblVar._contType = contType;
                    this.glblVar._last49Progress = -1;
                    this.glblVar.lastPlayerPosExact = -1;

                    if (this.glblVar._contType == "content") {
                        if (clip.baseClip && clip.baseClip.contentID && clip.baseClip.contentID !== this.glblVar.contentID) {
                            if (this.glblVar.debug)
                                this.log("contentID changed" + clip.baseClip.contentID);
                            if (this.glblVar.debug && clip.chapter)
                                this.log("chapter index=" + clip.chapter.index);

                            if (this.glblVar.event3_fired) {
                                this.doLastTick();
                                
                                if (this.gg1)
                                    this.gg1.ggPM("57", this.glblVar._last49Progress);
                                if (this.glblVar.debug)
                                    this.log("SDKEvent 57 - " + this.glblVar._last49Progress + " (length=" + this.contLengthSent + ")");
                                this.glblVar.event3_fired = false;
                                this.glblVar.event15_fired = false;
                            }
                        }
                    }

                    if (this.glblVar.event3_fired == false &&
                            (this.glblVar._contType == "content" || this.glblVar._contType == "ad" && this.glblVar._adType != "postroll")) {
                        
                        this.getMetadata(clip, viCont);
//                      Don't pull the length value here. It can be incorrect.

                        this.glblVar._last49Progress = -1;
                        this.glblVar.lastPlayerPosExact = -1;
                        
                        viCont[META_LENGTH] = this.glblVar.contLength;
                        if (this.glblVar.customLength !== null)
                            viCont[META_LENGTH] = this.glblVar.customLength;
                    
                        if (this.isDCR()) {
                            if (this.gg1)
                                this.gg1.ggPM("loadMetadata", viCont);
                            if (this.glblVar.debug)
                                this.log("SDKEvent 3 - " + this.printObject(viCont, null, 2));
                            this.glblVar.event3_fired = true;
                            this.contLengthSent = viCont[META_LENGTH];
                        } else {
                            this.glblVar.event3_fired = false;
                            if (this.glblVar.debug)
                                this.log("onMediaStart: No custom data provided. Event 3 has not been emitted. Metadata: " + this.printObject(viCont, null, 2));
                        }
                    }

                    if (this.glblVar._contType == "ad") {
                        if (this.glblVar.event15_fired == false) {
                            this.getMetadata(clip, viAd);
                            //this.getMediaLength(clip, viAd);
                        }
                    }

                    if (this.glblVar._contType == "content") {
                        this.getMetadata(clip, viCont);
                        //this.getMediaLength(clip, viCont);
                        // mediaLength will be taken in mediaPlaying event as a workaround.
                        // The length returned in mediaStart event is incorrect on Android.
                        this.checkForLive(clip);
                        this.sendId3FromArray();    // Flush all buffered id3
                    }
                } catch (e) {
                }
            },

            onMediaCuePoint: function (evt) {
                // Check for PRIV key for ID3
                try {
                    if (this.glblVar.debug)
                        this.log("PlayerEvent MediaCuePoint");
                    if (evt && evt.data && evt.data.cue && evt.data.cue.key === 'PRIV') {
                        var id3 = evt.data.cue.info;
                        if (id3 !== null) {
                            if (typeof id3 === "string")
                            {
                                // For old version of the player: id3 had type="string"
                                // Check for Nielsen ID3 tag
                                if (id3.substring(0, 15) === "www.nielsen.com") {
                                    if (this.glblVar._contType == "ad") {
                                        this.saveId3ToArray(id3);
                                    } else {
                                        this.sendId3FromArray();    // Flush all buffered id3
                                        // Send id3
                                        if (this.gg1)
                                            this.gg1.ggPM("55", id3);
                                        if (this.glblVar.debug)
                                            this.log("SDKEvent 55 - " + id3);
                                    }
                                }
                            }
                        }
                        return;
                    }
                } catch (e) {
                }
            },

            sendId3FromArray: function () {
                var i;
                for (i = 0; i < this.glblVar.arId3.length; i++)
                {
                    var id3 = this.glblVar.arId3[i];
                    if (this.gg1)
                        this.gg1.ggPM("55", id3);
                    if (this.glblVar.debug)
                        this.log("SDKEvent 55 - (from array) id3=" + id3);
                }
                this.glblVar.arId3 = [];
            },

            saveId3ToArray: function (obj) {
                if (this.glblVar.debug)
                    this.log("(push to array) id3=" + obj);
                this.glblVar.arId3.push(obj);
            },

            checkCustomData: function (customObject, splitCO) {
                var cnt = 0;
                splitCO.tp = {};
                splitCO.co = {};
                if (customObject) {
                    // TP will not provide contentCustomData object at all,
                    // if there is NO client's custom field
                    for (var i in customObject) {
                        /*
                         * The following properties are described in
                         * https://docs.theplatform.com/help/player-customdata
                         * 
                        Name    Type    Description
                        globalDataType  String  The full name of the data type of this object, which is com.theplatform.pdk.data::CustomData.
                        map Object  This property is for internal use only.
                        nameSpaceUrl    String  The namespace URL for the custom fields.
                        prefix  String  The namespace prefix for the custom fields.
                        searchMap   Object  This property is for internal use only.
                         * Property "uri" is not described th the documentation,
                         * nevertheless it's provided by the player.
                         * It's not a user defined property, so we ignore it.
                         */
                        var par = customObject[i];
                        if (i == "globalDataType" || i == "map" || i == "nameSpaceUrl" || i == "prefix" || i == "searchMap"
                                || i == "uri") {
                            splitCO.tp[i] = par;
                        } else {
                            if (typeof par !== 'undefined') {
                                    if (i === META_LENGTH) {
                                        // Don't count "length" parameter
                                        // It's not considered as custom value
                                    }
                                    else
                                        cnt ++;
                                    splitCO.co[i] = par;
                            }
                        }
                    }
                }
                return cnt;
            },

            getMetadata: function (clip, vi) {
                //Changing isFullepisode to yes or no comes in as a string and advertisingType is a string
                //clip.baseClip.contentCustomData where isFullEpisode and advertisingType reside
                if (!clip)
                    return;
                var bco = clip.baseClip;
                if (!bco)
                    return;
                var clipTitle = clip.title || bco.title;
                // load defaults first
                this.copyCustomParams(this.cmsDefaults, vi);

                this.glblVar.contLength = META_LENGTH_DEFAULT_VALUE;  // Initial value. If it's unknown, 0 will be sent to the SDK
                if (clipTitle)
                    vi.title = clipTitle;
                

                // Don't use contenID as assetid!
                vi.chapter = (clip.chapter && typeof clip.chapter.index === "number") ? clip.chapter.index + 1 : 1;
                if (typeof bco.URL === "string")
                    vi.mediaURL = bco.URL;

                if (this.glblVar.debug)
                    this.log("baseClip=" + this.printObject(bco, null, 2));

                if (bco.isAd || clip.chapter == null) {
                    vi.type = this.glblVar._adType;

                    var adIndexStr = "";
                    var clipIndexStr = "";
                    if (clip.chapter && typeof clip.chapter.adIndex === "number") {
                        adIndexStr = "_" + clip.chapter.adIndex.toString();
                    }
                    if (typeof clip.clipIndex === "number") {
                        clipIndexStr = "_" + clip.clipIndex.toString();
                    }
                    if (typeof clip.id !== "undefined" && clip.id !== null)
                        vi.nielsen_mediaid = clip.id + clipIndexStr + adIndexStr;
                    else if (typeof bco.id !== "undefined" && bco.id !== null)
                        vi.nielsen_mediaid = bco.id + clipIndexStr + adIndexStr;

                    if (this.glblVar._playlist && this.glblVar._playlist.clips && this.glblVar._currentChapter == 0) {
                        this.glblVar._currentChapter = 1;
                        this.getIagParams(this.glblVar._playlist.clips[this.glblVar._currentChapter]);
                    }
                } else {
                    vi.type = "content";
                    this.glblVar.contentID = bco.contentID;
                    if (bco.contentID)
                        vi.nielsen_mediaid = bco.contentID;
                    this.glblVar.isLive = null; // Unknown value;

                    var cnt = 0;
                    
                    var splitCustomData = {};
                    // Note, the following call doesn't copy custom params to vi.
                    // It's only checking if custom params exist in CLIP
                    // Copying will be done in parseMetadata.
                    cnt += this.checkCustomData(bco.contentCustomData, splitCustomData);
                    if (this.glblVar.debug)
                        this.log("customData=" + this.printObject(splitCustomData, null, 2));

                    cnt += this.copyCustomParams(this.custom_fields, vi);
                    this.glblVar.hasMeta = (cnt !== 0);

                    if (!this.glblVar._adType) {
                        this.glblVar._adType = "preroll";
                    } else if (this.glblVar._adType == "preroll") {
                        this.glblVar._adType = "midroll";
                    } else if (clip.chapter && typeof clip.chapter.index === "number" && clip.chapter.index + 1 == this.glblVar._chaptersLength) {
                        this.glblVar._adType = "postroll";
                    }
                    this.getIagParams(clip);
                }
                if (bco.contentCustomData) {
                    vi = this.parseMetadata(vi, bco.contentCustomData);
                    //Adding conditional to check advertising Type - AMC customization
                    if(!vi.hasOwnProperty("advertisingType")){
                        vi.adloadtype = "2";
                    }
                    else{
                        vi.adloadtype = (vi.advertisingType == "C3") ? "1" : "2";
                    }
                }
                if (bco.categories) {
                    vi = this.parseMetadata(vi, bco.categories);
                }
                for (var a in this.glblVar._iag_preroll_vi) {
                    vi[a] = this.glblVar._iag_preroll_vi[a];
                }
                if (bco.isAd || clip.chapter == null) {
                    if (typeof vi.nielsen_mediaid !== "undefined")
                        vi.assetid = vi.nielsen_mediaid;
                }
                
                //Adding conditional to check isFullEpisode - AMC customization
                if(!vi.hasOwnProperty("isFullEpisode")){
                        vi.isfullepisode = "n";
                    }
                    else{
                        var Episodeholder = (vi.isFullEpisode == "false") ? "n" : "y";
                        vi.isfullepisode = Episodeholder;
                    }

                for (var sI in this.ldrparams) {
                    if (sI.indexOf('ncstm') === 0) {
                        var processor = {
                            name: sI,
                            value: this.ldrparams[sI],
                            data: vi
                        };
                        this.procressCustomVar(processor);
                    }
                }
            },

            getMediaLength: function (to) {

                var vi = null;
                if (this.glblVar._contType == "content") vi = this.glblVar.viCont;
                else if (this.glblVar._contType == "ad") vi = this.glblVar.viAd;
                
                if (!to || !vi)
                    return;

                if (this.glblVar.contLength !== null && typeof this.glblVar.contLength !== "undefined" && this.glblVar.contLength !== META_LENGTH_DEFAULT_VALUE)
                    return;

                // Do the following if we have not taken the length of the media yet.
                var mediaLength = 0;
                // The video "Live or VOD" is already checked in checkForLive function.
                if (this.glblVar._contType == "content" && this.glblVar.isLive) {
                    mediaLength = INFINITY_VALUE;
                } else {
                    var len = to.durationAggregate || to.duration;
                    if (typeof len === "number")
                        mediaLength = Math.floor(len / 1000);
                }
                if (this.glblVar._contType == "content") this.glblVar.contLength = mediaLength;
                else if (this.glblVar._contType == "ad") vi[META_LENGTH] = mediaLength;
                
                if (this.glblVar.debug)
                    this.log("getMediaLength(): vi.length is set to " + this.glblVar.contLength);
            },

            setCustomLength: function (len) {
                if (len === null)
                    return;
                if (typeof len === "string") {
                    try {
                        len = parseInt(len);
                    } catch (e) {
                        return;
                    }
                }
                if (typeof len === "number") {
                    this.glblVar.customLength = len;
                }
            },

            checkForLive: function (clip) {
                // This verification is for content only!
                // This is a WORKAROUND for LIVE streams.
                // thePlatform suggested using a workaround to detect "live stream"
                // "expression" should be "nonstop" for Live
                // After they fix the issue with isLive property,
                // the following logic should be changed.
                if (clip.baseClip && clip.baseClip.expression === "nonstop") {
                    this.glblVar.isLive = true;
                } else {
                    this.glblVar.isLive = false;
                }
                
                if (this.glblVar.customLength !== null) {
                    this.glblVar.isLive = (this.glblVar.customLength === INFINITY_VALUE);
                }
                if (this.glblVar.debug)
                    this.log("checkForLive(): " + ( this.glblVar.isLive!==null ? (", IsLiveStream=" + this.glblVar.isLive) : ""));
            },

/*
 * It doesn't work for now due to the bug in thePlatform player.
 * It always returns false;
            checkForLive: function (timeObject, vi) {
                if (timeObject && timeObject.isLive) {
                    // This verification is for content only!
                    vi[META_LENGTH] = INFINITY_VALUE;
                    this.glblVar.isLive = true;
                } else {
                    this.glblVar.isLive = false;
                }
            },
*/
            
            copyCustomParams: function (custom, out) {
                var cnt = 0;
                try {
                    if (typeof custom === "object" && custom !== null && typeof out === "object" && out !== null) {
                            this.log("custom data=" + this.printObject(custom));
                            for (i in custom) {
                                    if (custom.hasOwnProperty(i)){
                                            var par = custom[i];
                                            if (typeof par !== 'undefined') {
                                                    if (i === META_LENGTH) {
                                                        this.setCustomLength(par);
                                                        // Don't count "length" parameter
                                                        // It's not considered as custom value
                                                    }
                                                    else {
                                                        cnt++;
                            }
                                                    out[i] = par;
                                            }
                                    }
                            }
                    }
                } catch(e) {}
                return cnt;
            },

            parseMetadata: function (oVi, oData) {
                if (typeof oData === "object" && oData !== null &&
                        typeof oVi === "object" && oVi !== null) {
                    for (var sI in oData) {
                        var _data = oData[sI];
                        if (_data && typeof _data == "object") {
                            if (_data.name)
                                oVi[sI] = this.parseCategoryName(_data.name);
                        } else if (_data) {
                            var par = _data;
                            if (typeof par !== 'undefined') {
                                    if (sI === META_LENGTH) {
                                        this.setCustomLength(par);
                                    }
                                    oVi[sI] = par;
                            }
                        }
                    }
                }
                return oVi;
            },

            procressCustomVar: function (oIn) {
                try {
                    if (typeof oIn.name !== "string" || typeof oIn.value !== "string" || typeof oIn.data !== "object" || oIn.data === null)
                        return;
                    var aName = oIn.name.split('_')
                            , aVal = oIn.value.split(',')
                            , keys = aVal[0].split('||');
                    if (typeof aVal !== "object" || aVal === null)
                        return;
                    if (typeof keys !== "object" || keys === null || typeof keys.length !== "number")
                        return;
                    if (typeof aName !== "object" || aName === null)
                        return;
                    for (var i = 0; i < keys.length; i++) {
                        aVal[0] = oIn.data.hasOwnProperty(keys[i]) ? oIn.data[keys[i]] : keys[i];
                        switch (aName[0].charAt(5)) {
                            case 'D':
                                aVal[0] = new Date(aVal[0]).getTime();
                                aVal[2] = aVal[2] === 'UTC' ? Date.now() : new Date(aVal[2]).getTime();
                                break;
                            case 'N':
                                aVal[0] = Number(aVal[0]);
                                aVal[2] = Number(aVal[2]);
                                break;
                            case 'S':
                                if (aVal[0].indexOf('+')) {
                                    var aCurrVal = [];
                                    for (var arr = aVal[0].split('+'), j = 0; j < arr.length; j++) {
                                        aCurrVal.push(oIn.data.hasOwnProperty(arr[j]) ? oIn.data[arr[j]] : arr[j]);
                                    }
                                }
                                oIn.data[aName[1]] = aCurrVal.join(aVal[1]);
                                return;
                                break;
                        }
                        oIn.data[aName[1]] = this.conditionor(aVal);
                    }
                } catch (e) {
                }
            },

            conditionor: function (oCond) {
                try {
                    var cond = oCond[1]
                            , val1 = oCond[0]
                            , aVal2 = isNaN(oCond[2]) ? oCond[2].split('||') : [oCond[2]]
                            , returnVal;
                    //console.log(aVal2.split("||"));
                    for (var i = 0; i < aVal2.length; i++) {
                        returnVal = false;
                        var val2 = aVal2[i];
                        if (isNaN(val1) && isNaN(val2)) {
                            val1 = val1.toLowerCase();
                            val2 = val2.toLowerCase();
                        }
                        switch (cond) {
                            case "lt":
                                returnVal = val1 < val2;
                                break;
                            case 'gt':
                                returnVal = val1 > val2;
                                break;
                            case "lte":
                                returnVal = val1 <= val2;
                                break;
                            case 'gte':
                                returnVal = val1 >= val2;
                                break;
                            case 'eq':
                                returnVal = val1 === val2;
                                break;
                        }
                        if (returnVal)
                            break;
                    }
                    return returnVal ? oCond[3] : oCond[4];
                } catch (e) {
                    return null;
                }
            },

            parseCategoryName: function (name) {
                var value = "";
                switch (this.ldrparams['enablecustomparse']) {
                    case "nbc":
                        var a = [];
                        if (name.indexOf(" - ") == -1)
                        {
                            a = name.split("/");
                            value = a[1];
                        } else
                        {
                            a = name.split("/");
                            var b = String(a[1]).split(" - ");
                            value = b[0];
                        }
                        break;
                    default:
                        value = name.substr(name.indexOf("/") + 1);
                }
                return value;
            },

            getIagParams: function (clip) {
                try {
                    // Cleaning up the object.
                    this.glblVar._iag_preroll_vi = {};

                    var _iag_preroll_vi = this.glblVar._iag_preroll_vi;
                    if (!clip || !clip.title)
                        return;
                    var bco = clip.baseClip;
                    if (this.ldrparams["displayprefix"] &&
                            this.ldrparams["displayfieldname"] &&
                            clip.baseClip.contentCustomData &&
                            clip.baseClip.contentCustomData.getValue(this.ldrparams["displayfieldname"], true) &&
                            String(this.ldrparams["displayprefix"]).length > 0) {
                        var displayName = this.ldrparams["displayprefix"] + " " + clip.baseClip.contentCustomData.getValue(this.ldrparams["displayfieldname"], true) + " - ";
                        _iag_preroll_vi.iag_epi = displayName + clip.title;
                        _iag_preroll_vi.iag_seg = clip.clipIndex;
                    } else {
                        _iag_preroll_vi.iag_epi = clip.title;
                        _iag_preroll_vi.iag_seg = clip.clipIndex;
                    }
                    if (bco) {
                        _iag_preroll_vi.iag_cte = bco.URL;
                        if (bco.contentCustomData) {
                            _iag_preroll_vi = this.parseMetadata(_iag_preroll_vi, bco.contentCustomData);
                        }
                        if (bco.categories) {
                            _iag_preroll_vi = this.parseMetadata(_iag_preroll_vi, bco.categories);
                        }
                    }
                } catch (e) {
                }
            },

            onMediaPlaying: function (pEvent) {
                try {
                    if (!pEvent || !pEvent.data)
                        return;
                    var to = pEvent.data;   // It's a TimeObject
                    var ct = to.currentTimeAggregate || to.currentTime;
                    var len = to.durationAggregate || to.duration;
                    
                    var viCont = this.glblVar.viCont;
                    
                    this.getMediaLength(to);
                    // getting mediaLength in mediaPlaying event as a workaround.
                    // The length returned in mediaStart event is incorrect on Android.

                    if (this.glblVar.debug)
                        this.log("currentTime=" + ct + ", duration=" + len + ", isLive=" + to.isLive);

                    if (this.isDCR() && this.glblVar.event15_fired === false) {
                        /*
                         * The following is removed.
                         * TODO: It should be considered after TP fix the bug with "isLive" property.
                        if (this.glblVar._contType === "content") {
                            this.checkForLive(to);
                        }
                        */
                    }
                    
                    this.openBlock();
                    
                    if (this.glblVar.event15_fired) {
                        var mediaTime;
                        if (this.glblVar.isLive === true && this.glblVar._contType === "content") {
                            mediaTime = Date.now() / 1000;
                        } else {
                            if (typeof ct !== "number")
                                    ct = 0;
                            mediaTime = ct / 1000;
                        }
//                        mediaTime = Math.round(mediaTime);

                        this.glblVar.lastPlayerPosExact = mediaTime;
                        mediaTime = Math.floor(mediaTime);

                        if (mediaTime !== this.glblVar._last49Progress) {
                            if (this.gg1)
                                this.gg1.ggPM("49", mediaTime);
                            if (this.glblVar.debug)
                                this.log("SDKEvent 49 - " + mediaTime);
                            this.glblVar._last49Progress = mediaTime;
                            if (mediaTime > 0 && this.glblVar._contType === 'content') {
                                this.glblVar._adType = "midroll";
                            } else if (mediaTime === 0 && this.glblVar._contType === 'content') {
                                this.glblVar._adType = "preroll";
                            }
                        }
                    }
                } catch (e) {
                }
            },
            
            doLastTick:  function () {
                if (this.glblVar.event15_fired) {
                    var mediaTime = this.glblVar.lastPlayerPosExact;
                    // We use round() for the last pos instead of floor()
                    mediaTime = Math.round(mediaTime);
                    if (mediaTime !== this.glblVar._last49Progress && mediaTime <= this.contLengthSent) {
                        // We will not send the completing "playhead position", if the value "mediaTime" is greater than the entire length of the video.
                        if (this.gg1)
                            this.gg1.ggPM("49", mediaTime);
                        if (this.glblVar.debug)
                            this.log("SDKEvent 49 (last)- " + mediaTime);
                        this.glblVar._last49Progress = mediaTime;
                    }
                }
            },
            
            onMediaEnd: function (pEvent) {
                try {
                    if (this.glblVar.debug)
                        this.log("PlayerEvent MediaEnd");
                    if (!pEvent || !pEvent.data)
                        return;

                    var clip = pEvent.data;
                    var bco = clip.baseClip;
                    if (!bco)
                        return;

                    if (this.glblVar.debug && clip.chapter)
                        this.log("chapter index=" + clip.chapter.index);

                    // Note, we are closing the AD block only.
                    // The CONTENT block is being closed in "MediaStart" event handler, because MediaEnd can be fired
                    // when content crosses the CHAPTER INDEX (certainly, with the same contentID).
                    // In this case it's not a new content, and we don't need to close the content block.
                    if (bco.isAd && this.glblVar.event15_fired) {
                        this.doLastTick();
                        
                        if (this.gg1)
                            this.gg1.ggPM("7", this.glblVar._last49Progress);
                        if (this.glblVar.debug)
                            this.log("SDKEvent 7 (closing ad...) - " + this.glblVar._last49Progress + " (length=" + this.glblVar.viAd[META_LENGTH] + ")");
                        this.glblVar.event15_fired = false;
                    }
                } catch (e) {
                }
            },

            onMediaComplete: function (pEvent) {
                try {
                    if (this.glblVar.debug)
                        this.log("PlayerEvent MediaComplete");
                    if (!pEvent || !pEvent.data)
                        return;
                    var clip = pEvent.data;
                    var bco = clip.baseClip;
                    if (!bco)
                        return;

                    // MediaComplete is not expected to be fired when chapter index changes.
                    // We need to close the content block in any case as we have received MediaComplete event.
                    if (!bco.isAd) {
                        if (this.glblVar.event3_fired) {
                            this.doLastTick();
                            
                            if (this.gg1)
                                this.gg1.ggPM("57", this.glblVar._last49Progress);
                            if (this.glblVar.debug)
                                this.log("SDKEvent 57 - " + this.glblVar._last49Progress + " (length=" + this.contLengthSent + ")");
                            this.glblVar.event3_fired = false;
                            this.glblVar.event15_fired = false;
                        } else {
                            if (this.glblVar.debug)
                                this.log("ID3 tagged stream. Neither event 3 nor event 57 has been emitted.");
                        }
                        this.glblVar._adType = "postroll";
                    }
                } catch (e) {
                }
            },

            onReleaseEnd: function (pEvent) {
                try {
                    if (this.glblVar.debug)
                        this.log("PlayerEvent ReleaseEnd");

                    if (this.glblVar.event3_fired) {
                        this.doLastTick();
                        
                        if (this.gg1)
                            this.gg1.ggPM("57", this.glblVar._last49Progress);
                        if (this.glblVar.debug)
                            this.log("SDKEvent 57 - " + this.glblVar._last49Progress + " (length=" + this.contLengthSent + ")");
                        this.glblVar.event3_fired = false;
                        this.glblVar.event15_fired = false;
                    }
                } catch (e) {
                }
            },

            printObject: function (obj, par1, par2) {

                function censor(key, value) {
                    if (value == Infinity) {
                        return "#Infinity";
                    }
                    return value;
                }

                try {
                    if (typeof par2 !== 'undefined')
                        return JSON.stringify(obj, censor, par2);
                    else
                        return JSON.stringify(obj, censor);
                } catch (e) {
                    return "ERROR in JSON.stringify: " + e.message;

                }
            }

        });
    
// Calls when player loads the plugin
if (typeof window.NOLBUNDLE === "undefined" ||
        window.NOLBUNDLE !== null && typeof window.NOLBUNDLE.nlsQ === "undefined") {
    // STANDARD SNIPPET {
    !function(t,n){ t[n]=t[n]||
     {
        nlsQ:function(e,o,c,r,s,i)
        {
         return s=t.document,
         r=s.createElement("script"),
         r.async=1,
         r.src=("http:"===t.location.protocol?"http:":"https:")+"//cdn-gl.imrworldwide.com/conf/"+e+".js#name="+o+"&ns="+n,
         i=s.getElementsByTagName("script")[0],
         i.parentNode.insertBefore(r,i),
         t[n][o]=t[n][o]||{g:c||{},
         ggPM:function(e,c,r,s,i){(t[n][o].q=t[n][o].q||[]).push([e,c,r,s,i])}},t[n][o]
        }
      }
    }
    (window,"NOLBUNDLE");
    // STANDARD SNIPPET }
}

var ap = new $pdk.plugin.NielsenSDK();
tpController.plugInLoaded(ap);
