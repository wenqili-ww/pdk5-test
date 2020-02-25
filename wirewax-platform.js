/**
	Sets the various resource URLs and loads the main dependencies file
	@class wirewax
**/

(function() {
    console.log("%c Wirewax Platform plugin loaded", "background: #444; color: #ffff00");

    if (window.wirewax && window.wirewax.loadedAsPlugin) {
        // Don't load the player for a second time if we're on brightcove
        return;
    }

    if (!window.console) {
        window.console = {
            log: function() {},
            warn: function() {},
            error: function() {},
            time: function() {},
            timeEnd: function() {}
        };
    }

    if (!window.wirewax) window.wirewax = { loadedAsPlugin: true };

    $pdk.plugin.wirewax = $pdk.extend(function() {}, {
        constructor: function() {
            console.log("%c PDK WIREWAX plugin constructor", "background: #444; color: #ffff00");
            // Create a new element in tpPlugins element
            this.container = document.createElement("div");
            this.container.style.position = "relative";
        },

        initialize: function(loadObj) {
            console.log("%c PDK WIREWAX plugin initialize", "background: #444; color: #ffff00");
            this.loadObj = loadObj || $pdk;
            this.controller = loadObj.controller;
            this.waxerMountTarget = document.createElement("div");
            this.waxerMountTarget.id = "waxxer-target";

            this.setDimensions();
            this.container.appendChild(this.waxerMountTarget);

            this.registerPDKEvents();
        },

        getDimensions: function() {
            let mediaArea = window.wirewax.waxxerPlugin.controller.getMediaArea();
            width = mediaArea.width;
            height = mediaArea.height;
            return { width: width, height: height };
        },

        setDimensions: function() {
            let mediaArea = this.getDimensions();
            this.waxerMountTarget.style.position = "absolute";
            this.waxerMountTarget.style.width = mediaArea.width + "px";
            this.waxerMountTarget.style.height = mediaArea.height + "px";
        },

        registerPDKEvents: function() {
            console.log("%c PDK WIREWAX plugin registerPDKEvents", "background: #444; color: #ffff00");
            window.wirewax.waxxerPlugin.controller.addEventListener("OnMediaAreaChanged", function() {
                window.wirewax.waxxerPlugin.setDimensions();
            });
        }
    });
    window.wirewax.waxxerPlugin = new $pdk.plugin.wirewax();
    $pdk.controller.plugInLoaded(window.wirewax.waxxerPlugin, window.wirewax.waxxerPlugin.container);

    // DO NOT DELETE
    //@@-- PLUGIN

    if (window.wirewax.recordLoad) {
        window.wirewax.recordLoad("wirewax.js loaded");
    }

    var getUrlParameter = function(url, name) {
        return decodeURIComponent((new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)").exec(url) || [, ""])[1].replace(/\+/g, "%20")) || null;
    };

    window.wirewax.loadTimeStart = new Date().getTime();
    if (!window.wirewax.fontUrl) window.wirewax.fontUrl = "//edge-assets.wirewax.com/";
    if (!window.wirewax.cdnUrl) window.wirewax.cdnUrl = "//edge-assets.wirewax.com/";
    if (!window.wirewax.vidCdnUrl) window.wirewax.vidCdnUrl = "//edge-vids.wirewax.com/80E87A/wirewax-videos/";
    if (window.wirewax.color) {
        window.wirewax.colour = window.wirewax.color;
    }
    if (!window.wirewax.colour) window.wirewax.colour = "#ff0044";
    if (!window.wirewax.skin) {
        window.wirewax.skin = "SkinDefault";
        window.wirewax.forceSkin = false;
    } else {
        window.wirewax.forceSkin = true;
    }
    // if(window.wirewax.viewer) {
    // 	window.wirewax.skin = 'SkinViewer';
    // 	window.wirewax.forceSkin = true;
    // }
    if (window.wirewax.dev) {
        window.wirewax.vidCdnUrl = "//edge-vids.wirewax.com/80E87A/wirewax-videos/";
        if (!window.wirewax.baseUrl) window.wirewax.baseUrl = "/v2779/";
        if (!window.wirewax.tagUrl) window.wirewax.tagUrl = "/javascripts/player/customisations/tags/";
        window.wirewax.cdnUrl = "//wirewax.s3.amazonaws.com/";
        if (!window.wirewax.vidCdnUrl) window.wirewax.vidCdnUrl = "//wirewax.s3.amazonaws.com/";
        if (!window.wirewax.widgetUrl) window.wirewax.widgetUrl = "/javascripts/player/customisations/widgets/";
        if (!window.wirewax.moduleUrl) window.wirewax.moduleUrl = "/javascripts/player/customisations/modules/";
        window.wirewax.html5Override = true;
        window.wirewax.noFallback = true;
        // Comment below for dev testing muted = true param
        window.wirewax.muted = false;
    } else {
        // if(!window.wirewax.baseUrl) window.wirewax.baseUrl = '//d32gk7d5ulxe8p.cloudfront.net/ww4release/';
        if (window.wirewax.testFolder) {
            if (!window.wirewax.baseUrl) window.wirewax.baseUrl = "//ww4player.s3.amazonaws.com/ww4-dev/";
            if (!window.wirewax.tagUrl) window.wirewax.tagUrl = "//ww4player.s3.amazonaws.com/customs-release/tags/";
            if (!window.wirewax.widgetUrl) window.wirewax.widgetUrl = "//ww4player.s3.amazonaws.com/customs-release/widgets/";
            if (!window.wirewax.moduleUrl) window.wirewax.moduleUrl = "//ww4player.s3.amazonaws.com/customs-release/modules/";
        } else if (window.wirewax.devCustoms) {
            if (!window.wirewax.baseUrl) window.wirewax.baseUrl = "//edge-player.wirewax.com/ww4release/";
            if (!window.wirewax.tagUrl) window.wirewax.tagUrl = "//ww4player.s3.amazonaws.com/customs-dev/tags/";
            if (!window.wirewax.widgetUrl) window.wirewax.widgetUrl = "//ww4player.s3.amazonaws.com/customs-dev/widgets/";
            if (!window.wirewax.moduleUrl) window.wirewax.moduleUrl = "//ww4player.s3.amazonaws.com/customs-dev/modules/";
        } else {
            if (!window.wirewax.baseUrl) window.wirewax.baseUrl = "https://edge-player.wirewax.com/ww4release/v2779/";
            if (!window.wirewax.tagUrl) window.wirewax.tagUrl = "https://edge-player.wirewax.com/customs-release/tags/";
            if (!window.wirewax.widgetUrl) window.wirewax.widgetUrl = "https://edge-player.wirewax.com/customs-release/widgets/";
            if (!window.wirewax.moduleUrl) window.wirewax.moduleUrl = "https://edge-player.wirewax.com/customs-release/modules/";
        }
    }

    if (!window.wirewax.version) {
        window.wirewax.version = null;
    }
    if (!window.wirewax.test && window.wirewax.version && window.wirewax.baseUrl.indexOf(window.wirewax.version) === -1) {
        window.wirewax.baseUrl = window.wirewax.baseUrl + window.wirewax.version + "/";
    }

    if (!window.wirewax.dev) {
        window.wirewax.disableScrubberTags = true;
    }

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(elt /*, from*/) {
            var len = this.length >>> 0;

            var from = Number(arguments[1]) || 0;
            from = from < 0 ? Math.ceil(from) : Math.floor(from);
            if (from < 0) from += len;

            for (; from < len; from++) {
                if (from in this && this[from] === elt) return from;
            }
            return -1;
        };
    }

    /**
      Loads a given script and calls the provided callback when done
      @method loadScriptAsync
      @param {String} scriptUrl the url of the script to load
      @param {Boolean} absoluteUrl set if the url is external or internal
      @param {Function} loadDoneCallback callback when the script is loaded
    **/
    var loadScriptAsync = function(scriptUrl, absoluteUrl, loadDoneCallback) {
        var scriptElem = document.createElement("script");
        var doneLoading = false;
        var head = document.getElementsByTagName("head")[0] || document.documentElement;
        scriptElem.onload = scriptElem.onreadystatechange = function() {
            if (!doneLoading && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
                doneLoading = true;
                if (loadDoneCallback) loadDoneCallback();
            }
        };

        scriptElem.src = (!absoluteUrl ? window.wirewax.baseUrl : "") + scriptUrl;
        head.appendChild(scriptElem);
    };

    /**
      Loads the HTML version of the player
      @method loadHTMLPlayer
    **/
    var loadHTMLPlayer = function() {
        var loadTimeStart = new Date().getTime();

        var commonCss = document.createElement("link");
        commonCss.setAttribute("rel", "stylesheet");
        commonCss.setAttribute("type", "text/css");
        commonCss.setAttribute("href", window.wirewax.baseUrl + "stylesheets/skins/common.css");
        document.getElementsByTagName("head")[0].appendChild(commonCss);

        if (isIE9or8()) {
            loadScriptAsync("javascripts/vendor/html5shiv.js", false, loadDependencies);
        } else {
            loadDependencies();
        }

        function isIE9or8() {
            var isIE9or8 = false;
            var ua = window.navigator.userAgent;
            if (ua.indexOf("MSIE ") > 0) {
                var IEVersion = parseInt(ua.substring(ua.indexOf("MSIE ") + 5, ua.indexOf(".", ua.indexOf("MSIE "))), 10);
                if (IEVersion <= 9) {
                    isIE9or8 = true;
                }
            }
            return isIE9or8;
        }

        function loadDependencies() {
            var loadTimeEnd = new Date().getTime();
            if (window.wirewax.recordLoad) {
                window.wirewax.recordLoad("shiv loaded", loadTimeEnd - loadTimeStart);
            }
            window.wirewax.mainLoadTimeStart = loadTimeEnd;
            var requireScript = document.createElement("script");
            requireScript.setAttribute("id", "wirewax-module-loader");

            if (window.wirewax.dev) {
                requireScript.setAttribute("data-main", window.wirewax.baseUrl + "javascripts/dependencies.js");
                requireScript.src = window.wirewax.baseUrl + "javascripts/vendor/require.js";
            } else if (window.wirewax.test) {
                requireScript.setAttribute("data-main", "/javascripts/tests/SpecRunner.js");
                requireScript.src = "/javascripts/vendor/require.js";
            } else {
                requireScript.src = "https://wenqili-ww.github.io/pdk5-test/wwplayer.js";
            }
            var head = document.getElementsByTagName("head")[0] || document.documentElement;
            head.appendChild(requireScript);
        }
    };

    if (window.$ && window.videojs) {
        $(document).ready(function() {
            loadHTMLPlayer();
        });
    } else {
        loadHTMLPlayer();
    }
})();
