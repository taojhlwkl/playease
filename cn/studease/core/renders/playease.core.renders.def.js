﻿(function(playease) {
	var utils = playease.utils,
		css = utils.css,
		events = playease.events,
		core = playease.core,
		renders = core.renders,
		rendermodes = renders.modes;
	
	renders.def = function(layer, config) {
		var _this = utils.extend(this, new events.eventdispatcher('renders.def')),
			_defaults = {},
			_video,
			_url,
			_src,
			_waiting;
		
		function _init() {
			_this.name = rendermodes.DEFAULT;
			
			_this.config = utils.extend({}, _defaults, config);
			
			_url = '';
			_src = '';
			_waiting = true;
			
			_video = utils.createElement('video');
			if (_this.config.airplay) {
				_video.setAttribute('x-webkit-airplay', 'allow');
			}
			if (_this.config.playsinline) {
				_video.setAttribute('playsinline', '');
				_video.setAttribute('x5-playsinline', '');
				_video.setAttribute('webkit-playsinline', '');
			}
			_video.preload = 'none';
			
			_video.addEventListener('durationchange', _onDurationChange);
			_video.addEventListener('waiting', _onWaiting);
			_video.addEventListener('playing', _onPlaying);
			_video.addEventListener('pause', _onPause);
			_video.addEventListener('ended', _onEnded);
			_video.addEventListener('error', _onError);
		}
		
		_this.setup = function() {
			var playlist = _this.config.playlist;
			var item = playlist.getItemAt(playlist.index);
			
			_video.src = item.file;
			_src = _video.src;
			
			_this.dispatchEvent(events.PLAYEASE_READY, { id: _this.config.id });
		};
		
		_this.play = function(url) {
			if (!_video.src || _video.src !== _src || url && url != _url) {
				if (url && url != _url) {
					if (!renders.def.isSupported(url)) {
						_this.dispatchEvent(events.PLAYEASE_RENDER_ERROR, { message: 'Resource not supported by render "' + _this.name + '".' });
						return;
					}
					
					_url = url;
				}
				
				_waiting = true;
				
				_video.src = _url;
				_video.load();
				
				_src = _video.src;
			}
			
			_video.play();
			_video.controls = false;
		};
		
		_this.pause = function() {
			_video.pause();
			_video.controls = false;
		};
		
		_this.reload = function(url) {
			_this.stop();
			_this.play(url);
		};
		
		_this.seek = function(offset) {
			if (_video.duration === NaN) {
				_this.play();
			} else {
				_video.currentTime = offset * _video.duration / 100;
			}
			_video.controls = false;
		};
		
		_this.stop = function() {
			_src = '';
			_waiting = true;
			
			_video.removeAttribute('src');
			_video.load();
			_video.controls = false;
		};
		
		_this.mute = function(muted) {
			_video.muted = muted;
		};
		
		_this.volume = function(vol) {
			_video.volume = vol / 100;
		};
		
		_this.hd = function(index) {
			
		};
		
		_this.getRenderInfo = function() {
			var buffered;
			var position = _video.currentTime;
			var duration = _video.duration;
			
			var ranges = _video.buffered, start, end;
			for (var i = 0; i < ranges.length; i++) {
				start = ranges.start(i);
				end = ranges.end(i);
				if (start <= position && position < end) {
					buffered = duration ? Math.floor(end / _video.duration * 10000) / 100 : 0;
				}
			}
			
			if (_waiting && end - position >= _this.config.bufferTime) {
				_waiting = false;
				_this.dispatchEvent(events.PLAYEASE_VIEW_PLAY);
			}
			
			return {
				buffered: buffered,
				position: position,
				duration: duration
			};
		};
		
		function _onDurationChange(e) {
			_this.dispatchEvent(events.PLAYEASE_DURATION, { duration: e.target.duration });
		}
		
		function _onWaiting(e) {
			_waiting = true;
			_this.dispatchEvent(events.PLAYEASE_VIEW_BUFFERING);
		}
		
		function _onPlaying(e) {
			_this.dispatchEvent(events.PLAYEASE_VIEW_PLAY);
		}
		
		function _onPause(e) {
			_this.dispatchEvent(events.PLAYEASE_VIEW_PAUSE);
		}
		
		function _onEnded(e) {
			_this.dispatchEvent(events.PLAYEASE_VIEW_STOP);
		}
		
		function _onError(e) {
			_this.dispatchEvent(events.PLAYEASE_RENDER_ERROR, { message: 'Render error ocurred!' });
		}
		
		_this.element = function() {
			return _video;
		};
		
		_this.resize = function(width, height) {
			css.style(_video, {
				width: width + 'px',
				height: height + 'px'
			});
		};
		
		_this.destroy = function() {
			
		};
		
		_init();
	};
	
	renders.def.isSupported = function(file) {
		var protocol = utils.getProtocol(file);
		if (protocol != 'http' && protocol != 'https') {
			return false;
		}
		
		if (utils.isMSIE(8)) {
			return false;
		}
		
		var mobilemap = [
			'm3u8', 'm3u', 'hls',
			'mp4', 'f4v', 'm4v', 'mov',
			'm4a', 'f4a', 'aac',
			'ogv', 'ogg',
			'mp3',
			'oga',
			'webm'
		];
		var html5map = [
			'mp4', 'f4v', 'm4v', 'mov',
			'm4a', 'f4a', 'aac',
			'ogv', 'ogg',
			'mp3',
			'oga',
			'webm'
		];
		var map = utils.isMobile() ? mobilemap : html5map;
		var extension = utils.getExtension(file);
		for (var i = 0; i < map.length; i++) {
			if (extension === map[i]) {
				return true;
			}
		}
		
		return false;
	};
})(playease);
