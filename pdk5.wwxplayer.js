wwplayer.define(["jquery", "AbstractPlayer", "pubsub", "globals", "LogEvent", "require-shim", "apiService"], function(
    $,
    AbstractPlayer,
    PubSub,
    globals,
    LogEvent,
    requireShim,
    apiService
) {
    console.log("%c WWX player instance for PDK 5.9", "background: #444; color: #ffff00");

    let self;

    let Player = AbstractPlayer.extend({
        init: function(videoElementContainer, updateScrubFn, playerOptions, readyCallback, errorCallback, videoData) {
            apiService.recordLegacyCode(globals.LEGACY_TYPE.DEAD_CODE, "tnt", "player", "This player is deprecated. Use ww instead.");

            this._super(videoElementContainer, updateScrubFn, playerOptions, readyCallback, errorCallback, videoData);

            self = this;
            self.player = window.wirewax.pdkPlugin.controller;
            self.container = $( "#waxxer-target" );
            self.setDimensions();
            self.controlsUnderVideo = true;
            self.hasOwnPlayButton = true;
            self.hasOwnPauseButton = true;
            self.disableRenditionController = true;
            self.forceVideoElementContainerAsResizeReference = true;
            globals.HIDE_SCRUBBER = false;

            /** Plugin States */
            self.wwxIsPlaying = false;
            self.replaySeekFromPDK =true;

            /**  When close widget, should resume play or not */
            // globals.PLAY_ON_WIDGET_CLOSE = false;

            // player event listeners
            window.wirewax.pdkPlugin.controller.addEventListener("OnMediaAreaChanged", function(event) {
                self.setDimensions();
            });

            window.wirewax.pdkPlugin.controller.addEventListener("OnMediaPlaying", function(event) {
                if (event.data.currentTime > 0) {
                    if (!self.startedPlaying) {
                        self.play();
                    }
                    self.playProgress = event.data.currentTime;
                    // console.log("current progress: ", self.playProgress/1000)
                }
            });

            window.wirewax.pdkPlugin.controller.addEventListener("OnMediaSeek", function(event) {
                self.playProgress = event.data.clip.currentMediaTime;
            });

            window.wirewax.pdkPlugin.controller.addEventListener("OnPlayerUnPause", function(event) {
                if (!self.wwxIsPlaying) {
                    self.play();
                }
            });

            window.wirewax.pdkPlugin.controller.addEventListener("OnPlayerPause", function(event) {
                self.PDKPlaying = false;
                if (self.wwxIsPlaying) {
                    self.pause();
                }
            });

            window.wirewax.pdkPlugin.controller.addEventListener("OnMediaEnd", function(event) {
                self.replaySeekFromPDK = true;
                if(!self.ended){
                    self.onEnd();
                }
            });

            self.videoLoadEnded = true;
            self.videoLoadStarted = true;

            window.setTimeout(function() {
                readyCallback(videoElementContainer);
            }, 50);
        },

        getDimensions: function() {
            let mediaArea = window.wirewax.pdkPlugin.controller.getMediaArea();
            width = mediaArea.width;
            height = mediaArea.height;
            return { width: width, height: height };
        },

        setDimensions: function() {
            let mediaArea = self.getDimensions();
            self.container.width( mediaArea.width );
            self.container.height( mediaArea.height );
        },

        getVolume: function() {
            return self.player.getVolume();
        },

        setVolume: function(volume) {
            try {
                window.wirewax.pdkPlugin.controller.setVolume(volume * 100);
                this._super(volume);
            } catch (err) {
                this._super(1);
            }
        },

        play: function() {
            try {
                self.wwxIsPlaying = true;

                /** When WWX side play, trigger PDK to play */
                window.wirewax.pdkPlugin.controller.pause(false);
                $pdk.hasPlayed = true;

                self.playerState = 1;
                this._super();
                PubSub.publish(globals.HIDE_LOADER);
            } catch (err) {
                console.log("play error", err);
            }
        },

        pause: function() {
            try {
                self.wwxIsPlaying = false;

                /** When WWX side pause, trigger PDK to pause */

                window.wirewax.pdkPlugin.controller.pause(true);
                self.playerState = 2;
                this._super();
            } catch (err) {
                console.log("pause error", err);
            }
        },

        onEnd: function() {
            self.wwxIsPlaying = false;
            self.playerState = 2;
            this._super();
        },

        getFrame: function() {
            try {
                return Math.floor(self.player.getCurrentTime() * self.videoData.fps);
            } catch (err) {
                return 0;
            }
        },

        getCurrentTime: function() {
            if (self.playProgress && self.playProgress !== 0) {
                return self.playProgress / 1000;
            } else {
                return 0;
            }
        },

        setCurrentTime: function(eventName, currentTime) {
            if (self.replaySeekFromPDK) {
                self.replaySeekFromPDK = false;
                return
            }
            let seekedToFrame = Math.ceil(currentTime);
            globals.LOG("Seeking to frame ", seekedToFrame);
            self.lastSeekedTo = seekedToFrame;
            self.frameSubscriptionsHit = [];
            PubSub.publish(globals.CURRENT_TIME_SET, currentTime * 1000);
            window.wirewax.pdkPlugin.controller.seekToPosition(currentTime * 1000);
            self.seeked(currentTime);
        },

        getReadyState: function() {
            if (self.playerReady) {
                return 4;
            } else {
                return 0;
            }
        },

        getBuffered: function() {
            try {
                return self.player.getVideoLoadedFraction() * self.player.getDuration();
            } catch (err) {
                return 0;
            }
        },

        recordMetrics: function() {},

        playing: function() {
            return self.playerState == 1;
        },

        paused: function() {},

        seeked: function(currentTime) {
            self.transmitClip();
            PubSub.publish(globals.HAS_SEEKED, currentTime);
        },

        seeking: function() {},

        playPause: function() {
            if (self.playerState === 2) {
                self.play();
            } else {
                self.pause();
            }
        },

        transmitClip: function() {
            let curTime = self.getCurrentTime();
            let frame = parseInt(curTime * self.videoData.fps) + 1;
            for (let clipIndex in this.clipData) {
                if (frame >= self.clipData[clipIndex]["in"] && frame < self.clipData[clipIndex]["out"]) {
                    self.curClip = clipIndex;
                    self.publishNextClip(clipIndex);
                    break;
                }
            }
        },

        initialise: function() {
            let superFn = this._super;

            $("#bottom-button-bar").css({ "pointer-events": "auto" });
            $("#wirewax-logo").remove();

            let waitForPlayer = window.setInterval(function() {
                if (self.player) {
                    window.clearInterval(waitForPlayer);
                    self.mainLoop();
                    superFn();
                    console.log("%c ::WIREWAX:: WIREWAX Plugin Player loaded", "background: #444; color: #ffff00");
                }
            }, 1000);
        }
    });

    return Player;
});
