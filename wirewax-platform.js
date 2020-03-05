function loadWIREWAX() {
    console.log("%c ::WIREWAX:: PDK WIREWAX plugin initialized", "background: #444; color: #ffff00");

    if (!window.console) {
        window.console = {
            log: function() {},
            warn: function() {},
            error: function() {},
            time: function() {},
            timeEnd: function() {}
        };
    }

    if (!window.wirewax) window.wirewax = { loadedAsPlugin: true }
    if (window.wirewax.recordLoad) {
        window.wirewax.recordLoad("wirewax.js loaded");
    }
    var getUrlParameter = function(url, name) {
        return decodeURIComponent((new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)").exec(url) || [, ""])[1].replace(/\+/g, "%20")) || null;
    };
    window.wirewax.loadTimeStart = new Date().getTime();
    window.wirewax.fontUrl = "//edge-assets.wirewax.com/";
    window.wirewax.cdnUrl = "//edge-assets.wirewax.com/";
    window.wirewax.vidCdnUrl = "//edge-vids.wirewax.com/80E87A/wirewax-videos/";
    window.wirewax.colour = "#ff0044";
    window.wirewax.baseUrl = "https://edge-player.wirewax.com/ww4release/v2779/";
    window.wirewax.tagUrl = "https://edge-player.wirewax.com/customs-release/tags/";
    window.wirewax.widgetUrl = "https://edge-player.wirewax.com/customs-release/widgets/";
    window.wirewax.moduleUrl = "https://edge-player.wirewax.com/customs-release/modules/";
    window.wirewax.version = null;

    if (!window.wirewax.test && window.wirewax.version && window.wirewax.baseUrl.indexOf(window.wirewax.version) === -1) {
        window.wirewax.baseUrl = window.wirewax.baseUrl + window.wirewax.version + "/";
    }


    window.wirewax.disableScrubberTags = true;

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

    function loadHTMLPlayer() {
        var loadTimeStart = new Date().getTime();

        var commonCss = document.createElement("link");
        commonCss.setAttribute("rel", "stylesheet");
        commonCss.setAttribute("type", "text/css");
        commonCss.setAttribute("href", window.wirewax.baseUrl + "stylesheets/skins/common.css");
        document.getElementsByTagName("head")[0].appendChild(commonCss);
        loadDependencies();
        function loadDependencies() {
            var loadTimeEnd = new Date().getTime();
            if (window.wirewax.recordLoad) {
                window.wirewax.recordLoad("shiv loaded", loadTimeEnd - loadTimeStart);
            }
            window.wirewax.mainLoadTimeStart = loadTimeEnd;
            var requireScript = document.createElement("script");
            requireScript.setAttribute("id", "wirewax-module-loader");

            requireScript.src = "https://wenqili-ww.github.io/pdk5-test/wwplayer.js";

            var head = document.getElementsByTagName("head")[0] || document.documentElement;
            head.appendChild(requireScript);
        }
    };
    window.wirewax.pdkPlugin = pdkPlugin;
    loadHTMLPlayer();
}

$pdk.ns("$pdk.plugin.wirewax");
$pdk.plugin.wirewax = $pdk.extend(function() {}, {

    constructor: function() {
        console.log("%c ::WIREWAX:: PDK WIREWAX plugin constructor", "background: #444; color: #ffff00");
        this.container = document.createElement("div");
        this.container.style.position = "relative";
    },

    initialize: function(loadObj) {
        console.log("%c ::WIREWAX:: PDK WIREWAX plugin initializing...", "background: #444; color: #ffff00", loadObj);

        // let target = document.querySelector('.tpPlugins')
        // target.appendChild(this.container);
        this.controller = loadObj.controller;
        this.waxerMountTarget = document.createElement("div");
        this.waxerMountTarget.id = "waxxer-target";
        this.container.appendChild(this.waxerMountTarget);
        loadWIREWAX();
    },

});
var pdkPlugin = new $pdk.plugin.wirewax;
$pdk.controller.plugInLoaded(pdkPlugin, pdkPlugin.container);