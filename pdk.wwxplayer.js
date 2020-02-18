wwplayer.define(["jquery", "AbstractPlayer", "pubsub", "globals", "LogEvent", "require-shim", "apiService"], function($, AbstractPlayer, PubSub, globals, LogEvent, requireShim, apiService)
{
	var self;

	var Player = AbstractPlayer.extend({
		init: function(videoElementContainer, updateScrubFn, playerOptions, readyCallback, errorCallback, videoData) {
			apiService.recordLegacyCode(globals.LEGACY_TYPE.DEAD_CODE, "tnt", "player", "This player is deprecated. Use ww instead.");
			this._super(videoElementContainer, updateScrubFn, playerOptions, readyCallback, errorCallback, videoData);
			self = this;

			self.controlsUnderVideo = true;
			self.hasOwnPlayButton = true;
			self.hasOwnPauseButton = true;
			self.disableRenditionController = true;
			self.forceVideoElementContainerAsResizeReference = true;
			globals.HIDE_SCRUBBER = false;
			globals.PLAY_ON_WIDGET_CLOSE = false;

			self.player = $pdk.controller;

			// player event listeners
	    	$pdk.controller.addEventListener('OnMediaPlaying', function(event) {
	    		if (event.data.currentTime > 0) {
	    			if(!self.startedPlaying) {
	    				self.play();
	    			}

		    		self.playProgress = event.data.currentTime;
	    		}
	    	});
	    	$pdk.controller.addEventListener('OnMediaSeek', function(event) {
	    		self.playProgress = event.data.clip.currentMediaTime;
	    	})
	    	$pdk.controller.addEventListener('OnPlayerUnPause', function(event) {
	    		self.play();
	    	})
	    	$pdk.controller.addEventListener('OnPlayerPause', function(event) {
	    		self.pause();
	    	});

	    	$pdk.controller.addEventListener('OnMediaEnd', function(event) {
	    		self.onEnd();
	    	});

	    	self.videoLoadEnded = true;
	    	self.videoLoadStarted = true;

			window.setTimeout(function() {
		    	readyCallback(videoElementContainer);
	    	}, 50)

		},
		getVolume: function() {
			return self.player.getVolume();
		},
		setVolume: function(volume) {
			try {
				$pdk.controller.setVolume(volume*100);
				this._super(volume);
			}
			catch(err){
				this._super(1);
			}
		},
		play: function() {
			try {
				$pdk.hasPlayed = true;
				self.playerState = 1;
				this._super();
				PubSub.publish(globals.HIDE_LOADER);
			}
			catch(err){
				console.log('play error', err);
			}
		},
		pause: function() {
			try {
				$pdk.controller.pause(true);
				self.playerState = 2;
				this._super();
			}
			catch(err) {
				console.log('pause error', err);
			}
		},
		getFrame : function() {
			try {
				return Math.floor(self.player.getCurrentTime() * self.videoData.fps);
			}
			catch(err){
				return 0;
			}
		},
		getCurrentTime: function() {
			if (self.playProgress && self.playProgress !== 0) {
				return self.playProgress/1000;
			}
			else {
				return 0;
			}
		},
		setCurrentTime: function(eventName, currentTime) {
			var seekedToFrame = Math.ceil(currentTime);
			globals.LOG("Seeking to frame ", seekedToFrame);
			self.lastSeekedTo = seekedToFrame;
			self.frameSubscriptionsHit = [];
			PubSub.publish(globals.CURRENT_TIME_SET, currentTime*1000);
			$pdk.controller.seekToPosition(currentTime*1000);
			self.seeked(currentTime);
		},
		getReadyState: function(){
			if (self.playerReady) {
				return 4;
			}
			else {
				return 0;
			}
		},
		getBuffered: function() {
			try {
				return self.player.getVideoLoadedFraction() * self.player.getDuration();
			}
			catch(err) {
				return 0;
			}
		},
        recordMetrics: function() {
        },
		playing: function() {
			return self.playerState == 1;
		},
		paused: function() {
		},
		seeked: function(currentTime) {
			self.transmitClip();
			PubSub.publish(globals.HAS_SEEKED, currentTime);
		},
	 	seeking: function() {
        },
		playPause: function() {
			if (self.playerState === 2) {
				self.play();
			}
			else {
				self.pause();
			}
		},
		transmitClip: function() {
		    var curTime = self.getCurrentTime();
		    var frame = parseInt(curTime * self.videoData.fps) + 1;
		    for (var clipIndex in this.clipData) {
		        if (frame >= self.clipData[clipIndex]['in'] && frame < self.clipData[clipIndex]['out']) {
		            self.curClip = clipIndex;
		            self.publishNextClip(clipIndex);
		            break;
		        }
		    }
		},
		initialise: function() {
			var superFn = this._super;

			$('#bottom-button-bar').css({'pointer-events':'auto'});
       		$('#wirewax-logo').css({'pointer-events':'auto'});

			var waitForPlayer = window.setInterval(function() {
				if (self.player) {
					window.clearInterval(waitForPlayer);
					self.mainLoop();
					superFn();
				}
			}, 1000);
		}
	});

	return Player;
});
