/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _srcControllerJs = __webpack_require__(1);
	
	(function () {
	  document.addEventListener('readystatechange', function readyStateChange() {
	    console.log('>>>>>>>> in addon');
	    var foxnob = new _srcControllerJs.Controller();
	    foxnob.start();
	    /*
	    console.log('>>>>>>>> in addon');
	    if (document.readyState === 'interactive') {
	      document.removeEventListener('readystatechange', readyStateChange);
	      var foxnob= new Controller();
	      foxnob.start();
	    }
	    */
	  });
	})();

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports.Controller = Controller;
	
	var _srcGestureControllerJs = __webpack_require__(2);
	
	var _srcStoreJs = __webpack_require__(3);
	
	function Controller() {}
	
	Controller.prototype.start = function () {
	  var _this = this;
	
	  this.SCREEN_TIMEOUT = 30;
	  this._waitingTimer = null;
	  this._store = new _srcStoreJs.Store();
	  this._configFrame = null;
	  this._contentFrame = null;
	  console.log('>>>> try to launch addon');
	  // TODO: 1. if we have settings to know how many LSW could be injected,
	  //          read it here.
	  //       2. some dummy function need to be filled later.
	  this.queue = new Promise(function (resolve, reject) {
	    _this.elements = {};
	    _this.originals = {};
	    // TODO: should read config here
	    resolve();
	  })
	  //    .then(this.setupEvents.bind(this)).then(this.label.bind(this, '>>> launching'))
	  .then(this.waitLockScreen.bind(this)).then(this.label.bind(this, '>>> wait lockscreen done')).then(this.setupElements.bind(this)).then(this.label.bind(this, '>>> set elements done')).then(this.setupGesture.bind(this)).then(this.label.bind(this, '>>> set gesture done'))
	  //    .then(this.loadDefault.bind(this)).then(this.label.bind(this, '>>> load default one'))
	  ['catch'](this.onMainPromiseError.bind(this));
	};
	
	Controller.prototype.label = function (lb) {
	  console.log(lb);
	};
	
	Controller.prototype.onMainPromiseError = function (err) {
	  console.error('>>> Controller Error: ', err);
	};
	
	Controller.prototype.setupGesture = function () {
	  var _this2 = this;
	
	  this._gestureController = new _srcGestureControllerJs.GestureController();
	  return new Promise(function (resolve, reject) {
	    _this2._gestureController.start().next(function () {
	      console.log('>>>> bind gesture in Controller');
	      _this2._gestureController.bindOnLeft(_this2.onLeftLockScreen.bind(_this2));
	      _this2._gestureController.bindOnRight(_this2.onRightLockScreen.bind(_this2));
	      _this2._gestureController.bindOnUp(_this2.onOpenConfig.bind(_this2));
	      _this2.elements.browserContainer.appendChild(_this2._gestureController.cover);
	    }).next(function () {
	      console.log('>>>> ending gesture setup in Controller');
	      resolve();
	    });
	  });
	};
	
	Controller.prototype.handleEvent = function (evt) {
	  switch (evt.type) {
	    case 'mozbrowserlocationchange':
	      // TODO: can preview the UI before apply that:
	      // add a field in the hash.
	      console.log('>>>>>>> locationchanged', evt);
	      var url = evt.detail;
	      var hash = url.replace(/^.*#/, '');
	      var screenNameParsed = hash.match(/screenname-(.*)/);
	      var commandParsed = hash.match(/command-(.*)/);
	      console.log('>>>>>> url:', url, hash, screenNameParsed, commandParsed);
	      if (null !== screenNameParsed) {
	        this.next(this.onScreenChange.bind(this, screenNameParsed[1]));
	      } else if (null !== commandParsed) {
	        this.next(this.onConfigCommand.bind(this, commandParsed[1]));
	      } else {
	        // loaded.
	        this.next(this.onConfigOpened.bind(this));
	      }
	      break;
	  }
	};
	
	Controller.prototype.onConfigCommand = function (command) {
	  if ('cancel' === command) {
	    if (null !== this._configFrame) {
	      this.elements.browserContainer.removeChild(this._configFrame);
	      this._configFrame = null;
	    } else {
	      console.log('>>>>>>> cant remove it');
	    }
	  }
	};
	
	Controller.prototype.next = function (steps) {
	  if (!Array.isArray(steps)) {
	    steps = [steps];
	  }
	  var stepPromises = steps.map(function (step) {
	    return step();
	  });
	  this.queue = this.queue.then(function () {
	    return Promise.all(stepPromises)['catch'](console.error.bind(console));
	  })['catch'](console.error.bind(console));
	  return this;
	};
	
	Controller.prototype.onConfigOpened = function () {
	  if (this._waitingTimer) {
	    clearTimeout(this._waitingTimer);
	  }
	};
	
	Controller.prototype.onScreenChange = function (parsed) {
	  var _this3 = this;
	
	  var screenurl = decodeURIComponent(parsed);
	  var local = null === screenurl.match(/^http/);
	  console.log('>>>>> onScreenChange: ', parsed, local, screenurl);
	  if (local) {
	    var name = screenurl;
	    this.fromNameToInstalled(name).then(function (appinfo) {
	      if (appinfo) {
	        _this3._store.submitDefault(name, local, appinfo);
	        if (_this3._configFrame) {
	          _this3.elements.browserContainer.removeChild(_this3._configFrame);
	          _this3._configFrame = null;
	        }
	        if (_this3._contentFrame) {
	          _this3.elements.browserContainer.removeChild(_this3._contentFrame);
	          _this3._contentFrame = null;
	        }
	        _this3.loadDefault();
	      } else {
	        console.error('No such content: ', screenurl);
	      }
	    });
	  } else {
	    this._store.submitDefault(screenurl, local);
	    if (this._configFrame) {
	      this.elements.browserContainer.removeChild(this._configFrame);
	      this._configFrame = null;
	    }
	    if (this._contentFrame) {
	      this.elements.browserContainer.removeChild(this._contentFrame);
	      this._contentFrame = null;
	    }
	    this.loadDefault();
	  }
	};
	
	Controller.prototype.onWaintingScreenTimeout = function () {
	  // TODO: show failure and remove the message and cover.
	};
	
	Controller.prototype.showWaitingCover = function () {
	  console.log('>>>>>> showWaitingCover');
	};
	
	Controller.prototype.onOpenConfig = function () {
	  var _this4 = this;
	
	  console.log('>>>>>>>>> onOpenConfig');
	  var url = 'https://foxknob.herokuapp.com/#';
	  this.next(this.showWaitingCover.bind(this)).next(function () {
	    console.log('>>>>>> assertConnection');
	    return _this4.assertConnection()['catch'](function () {
	      _this4.promptNoConnection(url);
	    });
	  }).next(function () {
	    console.log('>>>>> open config create frame', _this4._configFrame);
	    if (_this4._configFrame) {
	      _this4.elements.browserContainer.removeChild(_this4._configFrame);
	      _this4._configFrame = null;
	    }
	    _this4._waitingTimer = setTimeout(_this4.onWaintingScreenTimeout, _this4.SCREEN_TIMEOUT);
	    console.log('>>>>> set timeout');
	    var iframe = _this4.createScreenFrame();
	    iframe.classList.add('foxnob-config');
	    iframe.style.zIndex = '65535';
	    iframe.src = url;
	    _this4._configFrame = iframe;
	    console.log('>>>>> append');
	    _this4.elements.browserContainer.appendChild(iframe);
	    iframe.addEventListener('mozbrowserlocationchange', _this4);
	    console.log('>>>>> done');
	  });
	};
	
	Controller.prototype.createScreenFrame = function () {
	  var iframe = document.createElement('iframe');
	  iframe.id = 'foxnob-activated-screen';
	  iframe.setAttribute('mozbrowser', 'true');
	  iframe.setAttribute('remote', 'true');
	  iframe.style.position = 'fixed';
	  return iframe;
	};
	
	Controller.prototype.promptNoConnection = function (url) {
	  console.error('No Internet Connection for the Screen: ', url);
	};
	
	Controller.prototype.loadDefault = function () {
	  var _this5 = this;
	
	  var _store$fetchDefault = this._store.fetchDefault('foxnob-default');
	
	  var url = _store$fetchDefault.url;
	  var manifest = _store$fetchDefault.manifest;
	
	  var iframe = this.createScreenFrame();
	  console.log('>>>> want to load default: ', url, manifest);
	  // Remote. Need internet.
	  if (!manifest) {
	    this.assertConnection().then(function () {
	      console.log('>>> no manifest');
	      iframe.style.zIndex = '1';
	      iframe.style.background = 'black';
	      iframe.setAttribute('src', url);
	      _this5._contentFrame = iframe;
	      _this5.elements.browserContainer.appendChild(iframe);
	    })['catch'](function () {
	      _this5.promptNoConnection(url);
	    });
	  } else {
	    console.log('>>> with manifest');
	    iframe.setAttribute('src', url);
	    iframe.setAttribute('mozapp', manifest);
	    iframe.style.background = 'black';
	    iframe.style.zIndex = '1';
	    this._contentFrame = iframe;
	    this.elements.browserContainer.appendChild(iframe);
	  }
	};
	
	Controller.prototype.fromNameToInstalled = function (name) {
	  return navigator.mozApps.mgmt.getAll().then(function (apps) {
	    return apps.filter(function (app) {
	      return name === app.manifest.name;
	    })[0];
	  });
	};
	
	Controller.prototype.assertConnection = function () {
	  // TODO
	  return Promise.resolve();
	};
	
	Controller.prototype.loadDummyScreenLeft = function () {
	  var iframe = document.createElement('iframe');
	  var old = document.querySelector('#activated-lockscreen-content');
	  this.elements.browserContainer.removeChild(old);
	  iframe.id = 'activated-lockscreen-content';
	  iframe.setAttribute('mozbrowser', 'true');
	  iframe.setAttribute('remote', 'true');
	  iframe.src = 'app://calendar.gaiamobile.org/index.html';
	  this.elements.browserContainer.appendChild(iframe);
	};
	
	Controller.prototype.loadDummyScreenRight = function () {
	  var iframe = document.createElement('iframe');
	  var old = document.querySelector('#activated-lockscreen-content');
	  this.elements.browserContainer.removeChild(old);
	  iframe.id = 'activated-lockscreen-content';
	  iframe.setAttribute('mozbrowser', 'true');
	  iframe.setAttribute('remote', 'true');
	  iframe.src = 'app://clock.gaiamobile.org/index.html';
	  this.elements.browserContainer.appendChild(iframe);
	};
	
	Controller.prototype.waitLockScreen = function () {
	  var resolve;
	  var promise = new Promise(function (_r, _j) {
	    resolve = _r;
	  });
	  var solveIt = function solveIt() {
	    window.removeEventListener('lockscreen-appopened', solveIt);
	    resolve();
	  };
	  window.addEventListener('lockscreen-appopened', solveIt);
	  return promise;
	};
	
	Controller.prototype.setupEvents = function () {
	  navigator.mozApps.mgmt.addEventListener('enabledstatechange', this);
	  navigator.mozApps.mgmt.addEventListener('uninstall', this);
	};
	
	Controller.prototype.setupElements = function () {
	  this.elements.window = document.querySelector('.appWindow.lockScreenWindow');
	  if (!this.elements.window || !this.elements.window.classList.contains('active')) {
	    throw new Error('No LockScreen while setting up.');
	  }
	  this.elements.frame = document.querySelector('#lockscreen-frame');
	  this.elements.browserContainer = this.elements.frame.parentElement;
	  this.elements.background = document.querySelector('#lockscreen-background');
	
	  this.originals.backgroundImage = this.elements.background.style.backgroundImage;
	  this.originals.backgroundColor = this.elements.background.style.backgroundColor;
	  this.originals.browserContainerBackground = this.elements.browserContainer.style.background;
	
	  this.elements.background.style.background = 'none';
	  this.elements.browserContainer.background = 'none';
	};
	
	Controller.prototype.onEnable = function () {};
	
	Controller.prototype.onDisable = function () {};
	
	Controller.prototype.onLeftLockScreen = function () {
	  console.log('>>>> on left lockscreen');
	  this.loadDummyScreenLeft();
	};
	
	Controller.prototype.onRightLockScreen = function () {
	  console.log('>>>> on right lockscreen');
	  this.loadDummyScreenRight();
	};
	
	/*
	Controller.prototype.handleEvent = function(e) {
	  // debug at air
	  // var MANIFEST_URL = 'app://d8dc60c0-a7b0-014b-8659-ae57ca7f5fca/manifest.webapp';
	  // online version
	  var MANIFEST_URL = 'https://greg-weng.github.io/replacable-lockscreens/manifest.webapp';
	  if (e.application.manifestURL !== MANIFEST_URL) {
	    return;
	  }
	
	  switch(e.type) {
	    case 'enabledstatechange':
	      if (e.application.enabled) {
	        this.next(this.onEnable.bind(this));
	      } else {
	        this.next(this.onDisable.bind(this));
	      }
	      break;
	    case 'uninstall':
	      this.next(this.onUninstall.bind(this));
	      break;
	  }
	};
	*/
	
	Controller.prototype.onUninstall = function () {
	  navigator.mozApps.mgmt.removeEventListener('enabledstatechange', this);
	  navigator.mozApps.mgmt.removeEventListener('uninstall', this);
	};

/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';
	
	/* global Hammer */
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports.GestureController = GestureController;
	
	function GestureController() {}
	
	GestureController.prototype.start = function () {
	  var _this = this;
	
	  this.queue = Promise.resolve();
	  this.setupCover();
	  var hammer = new Hammer.Manager(this.cover);
	  var swipe = new Hammer.Swipe();
	  hammer.add(swipe);
	  hammer.on('swipeleft', function () {
	    console.log('<<<<<< left');
	    _this.next(_this.leftBinders).next(function () {
	      console.log('<<<<<< after left');
	    });
	  });
	  hammer.on('swiperight', function () {
	    console.log('>>>>> right');
	    _this.next(_this.rightBinders).next(function () {
	      console.log('>>>>>> after right');
	    });
	  });
	  hammer.on('swipeup', function () {
	    console.log('^^^^^^^ up', _this.upBinders.length);
	    _this.next(_this.upBinders).next(function () {
	      console.log('^^^^^^^^ after up');
	    });
	  });
	  this.leftBinders = [];
	  this.rightBinders = [];
	  this.upBinders = [];
	  return this;
	};
	
	GestureController.prototype.setupCover = function () {
	  this.cover = document.createElement('div');
	  this.cover.id = 'foxnob-cover';
	  // debug color
	  //this.cover.style.background = 'rgba(0, 100, 0, 0.1)';
	  this.cover.style.width = '100%';
	  this.cover.style.height = '80%';
	  this.cover.style.position = 'fixed';
	  this.cover.style.top = '40px';
	  this.cover.style.zIndex = '8';
	};
	
	GestureController.prototype.next = function (steps) {
	  if (!Array.isArray(steps)) {
	    steps = [steps];
	  }
	  var stepPromises = steps.map(function (step) {
	    return step();
	  });
	  this.queue = this.queue.then(function () {
	    return Promise.all(stepPromises);
	  })['catch'](console.error.bind(console));
	  return this;
	};
	
	GestureController.prototype.bindOnLeft = function (cb) {
	  this.leftBinders.push(cb);
	};
	
	GestureController.prototype.bindOnRight = function (cb) {
	  this.rightBinders.push(cb);
	};
	
	GestureController.prototype.bindOnUp = function (cb) {
	  this.upBinders.push(cb);
	};

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports.Store = Store;
	
	function Store() {}
	
	Store.prototype.fetchDefault = function () {
	  return JSON.parse(localStorage.getItem('foxnob-default'));
	};
	
	Store.prototype.submitDefault = function (url, local, payload) {
	  if (local) {
	    url = payload.origin;
	    localStorage.setItem('foxnob-default', JSON.stringify({ 'url': payload.origin + '/' + payload.manifest.launch_path + '#secure',
	      'manifest': payload.manifestURL }));
	    console.log('>>>>>>> submitlocaldefault: ', localStorage.getItem('foxnob-default'));
	  } else {
	    localStorage.setItem('foxnob-default', JSON.stringify({ 'url': url, 'manifest': null }));
	  }
	};

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgYTkwZThhNjM0ZTZkZGRiYTcwYjEiLCJ3ZWJwYWNrOi8vLy4vc3JjL1N0YXJ0dXAuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL0NvbnRyb2xsZXIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL0dlc3R1cmVDb250cm9sbGVyLmpzIiwid2VicGFjazovLy8uL3NyYy9TdG9yZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7OztBQ3RDQSxhQUFZLENBQUM7OzRDQUNjLENBQW1COztBQUM5QyxFQUFDLFlBQVk7QUFDWCxXQUFRLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLEVBQUUsU0FBUyxnQkFBZ0IsR0FBRztBQUN4RSxZQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDakMsU0FBSSxNQUFNLEdBQUUscUJBSlAsVUFBVSxFQUlhLENBQUM7QUFDN0IsV0FBTSxDQUFDLEtBQUssRUFBRSxDQUFDOzs7Ozs7Ozs7SUFTaEIsQ0FBQyxDQUFDO0VBQ0osR0FBRyxDOzs7Ozs7QUNoQkosYUFBWSxDQUFDOzs7O1NBR0csVUFBVSxHQUFWLFVBQVU7O21EQUZRLENBQTBCOzt1Q0FDdEMsQ0FBYzs7QUFDN0IsVUFBUyxVQUFVLEdBQUcsRUFBRTs7QUFDL0IsV0FBVSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsWUFBVzs7O0FBQ3RDLE9BQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO0FBQ3pCLE9BQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO0FBQzFCLE9BQUksQ0FBQyxNQUFNLEdBQUcsZ0JBTFAsS0FBSyxF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LGdCQUFnQixFQUNuQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxNQUFNLEdBQUcsR0FBRyxHQUNwQixPQUFPLENBQUMsUUFBUSxDQUFDLFdBQVcsR0FBRyxTQUFTO0FBQ2pELGlCQUFVLEVBQUUsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNyRCxZQUFPLENBQUMsR0FBRyxDQUFDLDhCQUE4QixFQUFFLFlBQVksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO0lBQ3JGLE1BQU07QUFDTCxpQkFBWSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFDbkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQztJQUNwRDtFQUNGLEMiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay9ib290c3RyYXAgYTkwZThhNjM0ZTZkZGRiYTcwYjFcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5pbXBvcnQgeyBDb250cm9sbGVyIH0gZnJvbSAnc3JjL0NvbnRyb2xsZXIuanMnO1xuKGZ1bmN0aW9uICgpIHtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncmVhZHlzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uIHJlYWR5U3RhdGVDaGFuZ2UoKSB7XG4gICAgY29uc29sZS5sb2coJz4+Pj4+Pj4+IGluIGFkZG9uJyk7XG4gICAgdmFyIGZveG5vYj0gbmV3IENvbnRyb2xsZXIoKTtcbiAgICBmb3hub2Iuc3RhcnQoKTtcbiAgICAvKlxuICAgIGNvbnNvbGUubG9nKCc+Pj4+Pj4+PiBpbiBhZGRvbicpO1xuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnaW50ZXJhY3RpdmUnKSB7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdyZWFkeXN0YXRlY2hhbmdlJywgcmVhZHlTdGF0ZUNoYW5nZSk7XG4gICAgICB2YXIgZm94bm9iPSBuZXcgQ29udHJvbGxlcigpO1xuICAgICAgZm94bm9iLnN0YXJ0KCk7XG4gICAgfVxuICAgICovXG4gIH0pO1xufSkoKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL1N0YXJ0dXAuanNcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5pbXBvcnQgeyBHZXN0dXJlQ29udHJvbGxlciB9IGZyb20gJ3NyYy9HZXN0dXJlQ29udHJvbGxlci5qcyc7XG5pbXBvcnQgeyBTdG9yZSB9IGZyb20gJ3NyYy9TdG9yZS5qcyc7XG5leHBvcnQgZnVuY3Rpb24gQ29udHJvbGxlcigpIHt9XG5Db250cm9sbGVyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLlNDUkVFTl9USU1FT1VUID0gMzA7XG4gIHRoaXMuX3dhaXRpbmdUaW1lciA9IG51bGw7XG4gIHRoaXMuX3N0b3JlID0gbmV3IFN0b3JlKCk7XG4gIHRoaXMuX2NvbmZpZ0ZyYW1lID0gbnVsbDtcbiAgdGhpcy5fY29udGVudEZyYW1lID0gbnVsbDtcbiAgY29uc29sZS5sb2coJz4+Pj4gdHJ5IHRvIGxhdW5jaCBhZGRvbicpO1xuICAvLyBUT0RPOiAxLiBpZiB3ZSBoYXZlIHNldHRpbmdzIHRvIGtub3cgaG93IG1hbnkgTFNXIGNvdWxkIGJlIGluamVjdGVkLFxuICAvLyAgICAgICAgICByZWFkIGl0IGhlcmUuXG4gIC8vICAgICAgIDIuIHNvbWUgZHVtbXkgZnVuY3Rpb24gbmVlZCB0byBiZSBmaWxsZWQgbGF0ZXIuXG4gIHRoaXMucXVldWUgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLmVsZW1lbnRzID0ge307XG4gICAgICB0aGlzLm9yaWdpbmFscyA9IHt9O1xuICAgICAgLy8gVE9ETzogc2hvdWxkIHJlYWQgY29uZmlnIGhlcmVcbiAgICAgIHJlc29sdmUoKTtcbiAgICB9KVxuLy8gICAgLnRoZW4odGhpcy5zZXR1cEV2ZW50cy5iaW5kKHRoaXMpKS50aGVuKHRoaXMubGFiZWwuYmluZCh0aGlzLCAnPj4+IGxhdW5jaGluZycpKVxuICAgIC50aGVuKHRoaXMud2FpdExvY2tTY3JlZW4uYmluZCh0aGlzKSkudGhlbih0aGlzLmxhYmVsLmJpbmQodGhpcywgJz4+PiB3YWl0IGxvY2tzY3JlZW4gZG9uZScpKVxuICAgIC50aGVuKHRoaXMuc2V0dXBFbGVtZW50cy5iaW5kKHRoaXMpKS50aGVuKHRoaXMubGFiZWwuYmluZCh0aGlzLCAnPj4+IHNldCBlbGVtZW50cyBkb25lJykpXG4gICAgLnRoZW4odGhpcy5zZXR1cEdlc3R1cmUuYmluZCh0aGlzKSkudGhlbih0aGlzLmxhYmVsLmJpbmQodGhpcywgJz4+PiBzZXQgZ2VzdHVyZSBkb25lJykpXG4vLyAgICAudGhlbih0aGlzLmxvYWREZWZhdWx0LmJpbmQodGhpcykpLnRoZW4odGhpcy5sYWJlbC5iaW5kKHRoaXMsICc+Pj4gbG9hZCBkZWZhdWx0IG9uZScpKVxuICAgIC5jYXRjaCh0aGlzLm9uTWFpblByb21pc2VFcnJvci5iaW5kKHRoaXMpKTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLmxhYmVsID0gZnVuY3Rpb24obGIpIHtcbiAgY29uc29sZS5sb2cobGIpO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUub25NYWluUHJvbWlzZUVycm9yID0gZnVuY3Rpb24oZXJyKSB7XG4gIGNvbnNvbGUuZXJyb3IoJz4+PiBDb250cm9sbGVyIEVycm9yOiAnLCBlcnIpO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUuc2V0dXBHZXN0dXJlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2dlc3R1cmVDb250cm9sbGVyID0gbmV3IEdlc3R1cmVDb250cm9sbGVyKCk7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdGhpcy5fZ2VzdHVyZUNvbnRyb2xsZXIuc3RhcnQoKVxuICAgIC5uZXh0KCgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4+IGJpbmQgZ2VzdHVyZSBpbiBDb250cm9sbGVyJyk7XG4gICAgICB0aGlzLl9nZXN0dXJlQ29udHJvbGxlci5iaW5kT25MZWZ0KHRoaXMub25MZWZ0TG9ja1NjcmVlbi5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuX2dlc3R1cmVDb250cm9sbGVyLmJpbmRPblJpZ2h0KHRoaXMub25SaWdodExvY2tTY3JlZW4uYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLl9nZXN0dXJlQ29udHJvbGxlci5iaW5kT25VcCh0aGlzLm9uT3BlbkNvbmZpZy5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLl9nZXN0dXJlQ29udHJvbGxlci5jb3Zlcik7XG4gICAgfSlcbiAgICAubmV4dCgoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnPj4+PiBlbmRpbmcgZ2VzdHVyZSBzZXR1cCBpbiBDb250cm9sbGVyJyk7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUuaGFuZGxlRXZlbnQgPSBmdW5jdGlvbihldnQpIHtcbiAgc3dpdGNoIChldnQudHlwZSkge1xuICAgIGNhc2UgJ21vemJyb3dzZXJsb2NhdGlvbmNoYW5nZSc6XG4gICAgICAvLyBUT0RPOiBjYW4gcHJldmlldyB0aGUgVUkgYmVmb3JlIGFwcGx5IHRoYXQ6XG4gICAgICAvLyBhZGQgYSBmaWVsZCBpbiB0aGUgaGFzaC5cbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4+Pj4+IGxvY2F0aW9uY2hhbmdlZCcsIGV2dCk7XG4gICAgICB2YXIgdXJsID0gZXZ0LmRldGFpbDtcbiAgICAgIHZhciBoYXNoID0gdXJsLnJlcGxhY2UoL14uKiMvLCAnJyk7XG4gICAgICB2YXIgc2NyZWVuTmFtZVBhcnNlZCA9IGhhc2gubWF0Y2goL3NjcmVlbm5hbWUtKC4qKS8pO1xuICAgICAgdmFyIGNvbW1hbmRQYXJzZWQgPSBoYXNoLm1hdGNoKC9jb21tYW5kLSguKikvKTtcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4+Pj4gdXJsOicsIHVybCwgaGFzaCwgc2NyZWVuTmFtZVBhcnNlZCwgY29tbWFuZFBhcnNlZCk7XG4gICAgICBpZiAobnVsbCAhPT0gc2NyZWVuTmFtZVBhcnNlZCkge1xuICAgICAgICB0aGlzLm5leHQodGhpcy5vblNjcmVlbkNoYW5nZS5iaW5kKHRoaXMsIHNjcmVlbk5hbWVQYXJzZWRbMV0pKTtcbiAgICAgIH0gZWxzZSBpZihudWxsICE9PSBjb21tYW5kUGFyc2VkKSB7XG4gICAgICAgIHRoaXMubmV4dCh0aGlzLm9uQ29uZmlnQ29tbWFuZC5iaW5kKHRoaXMsIGNvbW1hbmRQYXJzZWRbMV0pKTtcbiAgICAgIH0gZWxzZSB7ICAvLyBsb2FkZWQuXG4gICAgICAgIHRoaXMubmV4dCh0aGlzLm9uQ29uZmlnT3BlbmVkLmJpbmQodGhpcykpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gIH1cbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLm9uQ29uZmlnQ29tbWFuZCA9IGZ1bmN0aW9uKGNvbW1hbmQpIHtcbiAgaWYgKCdjYW5jZWwnID09PSBjb21tYW5kKSB7XG4gICAgaWYgKG51bGwgIT09IHRoaXMuX2NvbmZpZ0ZyYW1lKSB7XG4gICAgICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5fY29uZmlnRnJhbWUpO1xuICAgICAgdGhpcy5fY29uZmlnRnJhbWUgPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZygnPj4+Pj4+PiBjYW50IHJlbW92ZSBpdCcpO1xuICAgIH1cbiAgfVxufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uKHN0ZXBzKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShzdGVwcykpIHtcbiAgICBzdGVwcyA9IFtzdGVwc107XG4gIH1cbiAgdmFyIHN0ZXBQcm9taXNlcyA9IHN0ZXBzLm1hcCgoc3RlcCkgPT4ge1xuICAgIHJldHVybiBzdGVwKCk7XG4gIH0pO1xuICB0aGlzLnF1ZXVlID0gdGhpcy5xdWV1ZS50aGVuKCgpID0+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoc3RlcFByb21pc2VzKS5jYXRjaChjb25zb2xlLmVycm9yLmJpbmQoY29uc29sZSkpO1xuICB9KS5jYXRjaChjb25zb2xlLmVycm9yLmJpbmQoY29uc29sZSkpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLm9uQ29uZmlnT3BlbmVkID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLl93YWl0aW5nVGltZXIpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5fd2FpdGluZ1RpbWVyKTtcbiAgfVxufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUub25TY3JlZW5DaGFuZ2UgPSBmdW5jdGlvbihwYXJzZWQpIHtcbiAgdmFyIHNjcmVlbnVybCA9IGRlY29kZVVSSUNvbXBvbmVudChwYXJzZWQpO1xuICB2YXIgbG9jYWwgPSAobnVsbCA9PT0gc2NyZWVudXJsLm1hdGNoKC9eaHR0cC8pKTtcbiAgY29uc29sZS5sb2coJz4+Pj4+IG9uU2NyZWVuQ2hhbmdlOiAnLCBwYXJzZWQsIGxvY2FsLCBzY3JlZW51cmwpO1xuICBpZiAobG9jYWwpIHtcbiAgICB2YXIgbmFtZSA9IHNjcmVlbnVybDtcbiAgICB0aGlzLmZyb21OYW1lVG9JbnN0YWxsZWQobmFtZSlcbiAgICAgIC50aGVuKChhcHBpbmZvKSA9PiB7XG4gICAgICAgIGlmIChhcHBpbmZvKSB7XG4gICAgICAgICAgdGhpcy5fc3RvcmUuc3VibWl0RGVmYXVsdChuYW1lLCBsb2NhbCwgYXBwaW5mbyk7XG4gICAgICAgICAgaWYgKHRoaXMuX2NvbmZpZ0ZyYW1lKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5fY29uZmlnRnJhbWUpO1xuICAgICAgICAgICAgdGhpcy5fY29uZmlnRnJhbWUgPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGhpcy5fY29udGVudEZyYW1lKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5fY29udGVudEZyYW1lKTtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRlbnRGcmFtZSA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMubG9hZERlZmF1bHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdObyBzdWNoIGNvbnRlbnQ6ICcsIHNjcmVlbnVybCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuX3N0b3JlLnN1Ym1pdERlZmF1bHQoc2NyZWVudXJsLCBsb2NhbCk7XG4gICAgaWYgKHRoaXMuX2NvbmZpZ0ZyYW1lKSB7XG4gICAgICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5fY29uZmlnRnJhbWUpO1xuICAgICAgdGhpcy5fY29uZmlnRnJhbWUgPSBudWxsO1xuICAgIH1cbiAgICBpZiAodGhpcy5fY29udGVudEZyYW1lKSB7XG4gICAgICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5fY29udGVudEZyYW1lKTtcbiAgICAgIHRoaXMuX2NvbnRlbnRGcmFtZSA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMubG9hZERlZmF1bHQoKTtcbiAgfVxufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUub25XYWludGluZ1NjcmVlblRpbWVvdXQgPSBmdW5jdGlvbigpIHtcbiAgLy8gVE9ETzogc2hvdyBmYWlsdXJlIGFuZCByZW1vdmUgdGhlIG1lc3NhZ2UgYW5kIGNvdmVyLlxufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUuc2hvd1dhaXRpbmdDb3ZlciA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnPj4+Pj4+IHNob3dXYWl0aW5nQ292ZXInKTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLm9uT3BlbkNvbmZpZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnPj4+Pj4+Pj4+IG9uT3BlbkNvbmZpZycpO1xuICB2YXIgdXJsID0gJ2h0dHBzOi8vZm94a25vYi5oZXJva3VhcHAuY29tLyMnO1xuICB0aGlzLm5leHQodGhpcy5zaG93V2FpdGluZ0NvdmVyLmJpbmQodGhpcykpXG4gICAgICAubmV4dCgoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCc+Pj4+Pj4gYXNzZXJ0Q29ubmVjdGlvbicpO1xuICAgICAgICByZXR1cm4gdGhpcy5hc3NlcnRDb25uZWN0aW9uKCkuY2F0Y2goKCkgPT4ge1xuICAgICAgICAgIHRoaXMucHJvbXB0Tm9Db25uZWN0aW9uKHVybCk7XG4gICAgICAgIH0pO1xuICAgICAgfSlcbiAgICAgIC5uZXh0KCgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJz4+Pj4+IG9wZW4gY29uZmlnIGNyZWF0ZSBmcmFtZScsIHRoaXMuX2NvbmZpZ0ZyYW1lKTtcbiAgICAgICAgaWYgKHRoaXMuX2NvbmZpZ0ZyYW1lKSB7XG4gICAgICAgICAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuX2NvbmZpZ0ZyYW1lKTtcbiAgICAgICAgICB0aGlzLl9jb25maWdGcmFtZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fd2FpdGluZ1RpbWVyID1cbiAgICAgICAgICBzZXRUaW1lb3V0KHRoaXMub25XYWludGluZ1NjcmVlblRpbWVvdXQsIHRoaXMuU0NSRUVOX1RJTUVPVVQpO1xuICAgICAgICBjb25zb2xlLmxvZygnPj4+Pj4gc2V0IHRpbWVvdXQnKTtcbiAgICAgICAgdmFyIGlmcmFtZSA9IHRoaXMuY3JlYXRlU2NyZWVuRnJhbWUoKTtcbiAgICAgICAgaWZyYW1lLmNsYXNzTGlzdC5hZGQoJ2ZveG5vYi1jb25maWcnKTtcbiAgICAgICAgaWZyYW1lLnN0eWxlLnpJbmRleCA9ICc2NTUzNSc7XG4gICAgICAgIGlmcmFtZS5zcmMgPSB1cmw7XG4gICAgICAgIHRoaXMuX2NvbmZpZ0ZyYW1lID0gaWZyYW1lO1xuICAgICAgICBjb25zb2xlLmxvZygnPj4+Pj4gYXBwZW5kJyk7XG4gICAgICAgIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5hcHBlbmRDaGlsZChpZnJhbWUpO1xuICAgICAgICBpZnJhbWUuYWRkRXZlbnRMaXN0ZW5lcignbW96YnJvd3NlcmxvY2F0aW9uY2hhbmdlJywgdGhpcyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCc+Pj4+PiBkb25lJyk7XG4gICAgICB9KTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLmNyZWF0ZVNjcmVlbkZyYW1lID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgaWZyYW1lLmlkID0gJ2ZveG5vYi1hY3RpdmF0ZWQtc2NyZWVuJztcbiAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnbW96YnJvd3NlcicsICd0cnVlJyk7XG4gIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ3JlbW90ZScsICd0cnVlJyk7XG4gIGlmcmFtZS5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gIHJldHVybiBpZnJhbWU7XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5wcm9tcHROb0Nvbm5lY3Rpb24gPSBmdW5jdGlvbih1cmwpIHtcbiAgY29uc29sZS5lcnJvcignTm8gSW50ZXJuZXQgQ29ubmVjdGlvbiBmb3IgdGhlIFNjcmVlbjogJywgdXJsKTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLmxvYWREZWZhdWx0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciB7IHVybCwgbWFuaWZlc3QgfSA9IHRoaXMuX3N0b3JlLmZldGNoRGVmYXVsdCgnZm94bm9iLWRlZmF1bHQnKTtcbiAgdmFyIGlmcmFtZSA9IHRoaXMuY3JlYXRlU2NyZWVuRnJhbWUoKTtcbiAgY29uc29sZS5sb2coJz4+Pj4gd2FudCB0byBsb2FkIGRlZmF1bHQ6ICcsIHVybCwgbWFuaWZlc3QpO1xuICAvLyBSZW1vdGUuIE5lZWQgaW50ZXJuZXQuXG4gIGlmICghbWFuaWZlc3QpIHtcbiAgICB0aGlzLmFzc2VydENvbm5lY3Rpb24oKS50aGVuKCgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4gbm8gbWFuaWZlc3QnKTtcbiAgICAgIGlmcmFtZS5zdHlsZS56SW5kZXggPSAnMSc7XG4gICAgICBpZnJhbWUuc3R5bGUuYmFja2dyb3VuZCA9ICdibGFjayc7XG4gICAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdzcmMnLCB1cmwpO1xuICAgICAgdGhpcy5fY29udGVudEZyYW1lID0gaWZyYW1lO1xuICAgICAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgdGhpcy5wcm9tcHROb0Nvbm5lY3Rpb24odXJsKTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmxvZygnPj4+IHdpdGggbWFuaWZlc3QnKTtcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdzcmMnLCB1cmwpO1xuICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ21vemFwcCcsIG1hbmlmZXN0KTtcbiAgICBpZnJhbWUuc3R5bGUuYmFja2dyb3VuZCA9ICdibGFjayc7XG4gICAgaWZyYW1lLnN0eWxlLnpJbmRleCA9ICcxJztcbiAgICB0aGlzLl9jb250ZW50RnJhbWUgPSBpZnJhbWU7XG4gICAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gIH1cbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLmZyb21OYW1lVG9JbnN0YWxsZWQgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiBuYXZpZ2F0b3IubW96QXBwcy5tZ210LmdldEFsbCgpXG4gICAgLnRoZW4oKGFwcHMpID0+IHtcbiAgICAgIHJldHVybiBhcHBzLmZpbHRlcigoYXBwKSA9PiB7XG4gICAgICAgIHJldHVybiAobmFtZSA9PT0gYXBwLm1hbmlmZXN0Lm5hbWUpO1xuICAgICAgfSlbMF07XG4gICAgfSk7XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5hc3NlcnRDb25uZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gIC8vIFRPRE9cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUubG9hZER1bW15U2NyZWVuTGVmdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gIHZhciBvbGQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWN0aXZhdGVkLWxvY2tzY3JlZW4tY29udGVudCcpO1xuICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIucmVtb3ZlQ2hpbGQob2xkKTtcbiAgaWZyYW1lLmlkID0gJ2FjdGl2YXRlZC1sb2Nrc2NyZWVuLWNvbnRlbnQnO1xuICBpZnJhbWUuc2V0QXR0cmlidXRlKCdtb3picm93c2VyJywgJ3RydWUnKTtcbiAgaWZyYW1lLnNldEF0dHJpYnV0ZSgncmVtb3RlJywgJ3RydWUnKTtcbiAgaWZyYW1lLnNyYyA9ICdhcHA6Ly9jYWxlbmRhci5nYWlhbW9iaWxlLm9yZy9pbmRleC5odG1sJztcbiAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLmFwcGVuZENoaWxkKGlmcmFtZSk7XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5sb2FkRHVtbXlTY3JlZW5SaWdodCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gIHZhciBvbGQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWN0aXZhdGVkLWxvY2tzY3JlZW4tY29udGVudCcpO1xuICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIucmVtb3ZlQ2hpbGQob2xkKTtcbiAgaWZyYW1lLmlkID0gJ2FjdGl2YXRlZC1sb2Nrc2NyZWVuLWNvbnRlbnQnO1xuICBpZnJhbWUuc2V0QXR0cmlidXRlKCdtb3picm93c2VyJywgJ3RydWUnKTtcbiAgaWZyYW1lLnNldEF0dHJpYnV0ZSgncmVtb3RlJywgJ3RydWUnKTtcbiAgaWZyYW1lLnNyYyA9ICdhcHA6Ly9jbG9jay5nYWlhbW9iaWxlLm9yZy9pbmRleC5odG1sJztcbiAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLmFwcGVuZENoaWxkKGlmcmFtZSk7XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS53YWl0TG9ja1NjcmVlbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmVzb2x2ZTtcbiAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZSgoX3IsIF9qKSA9PiB7XG4gICAgcmVzb2x2ZSA9IF9yO1xuICB9KTtcbiAgdmFyIHNvbHZlSXQgPSBmdW5jdGlvbiBzb2x2ZUl0KCkge1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdsb2Nrc2NyZWVuLWFwcG9wZW5lZCcsIHNvbHZlSXQpO1xuICAgIHJlc29sdmUoKTtcbiAgfTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvY2tzY3JlZW4tYXBwb3BlbmVkJywgc29sdmVJdCk7XG4gIHJldHVybiBwcm9taXNlO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUuc2V0dXBFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgbmF2aWdhdG9yLm1vekFwcHMubWdtdC5hZGRFdmVudExpc3RlbmVyKCdlbmFibGVkc3RhdGVjaGFuZ2UnLCB0aGlzKTtcbiAgbmF2aWdhdG9yLm1vekFwcHMubWdtdC5hZGRFdmVudExpc3RlbmVyKCd1bmluc3RhbGwnLCB0aGlzKTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLnNldHVwRWxlbWVudHMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5lbGVtZW50cy53aW5kb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYXBwV2luZG93LmxvY2tTY3JlZW5XaW5kb3cnKTtcbiAgaWYgKCF0aGlzLmVsZW1lbnRzLndpbmRvdyB8fCAhdGhpcy5lbGVtZW50cy53aW5kb3cuY2xhc3NMaXN0LmNvbnRhaW5zKCdhY3RpdmUnKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignTm8gTG9ja1NjcmVlbiB3aGlsZSBzZXR0aW5nIHVwLicpO1xuICB9XG4gIHRoaXMuZWxlbWVudHMuZnJhbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbG9ja3NjcmVlbi1mcmFtZScpO1xuICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIgPSB0aGlzLmVsZW1lbnRzLmZyYW1lLnBhcmVudEVsZW1lbnQ7XG4gIHRoaXMuZWxlbWVudHMuYmFja2dyb3VuZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsb2Nrc2NyZWVuLWJhY2tncm91bmQnKTtcblxuICB0aGlzLm9yaWdpbmFscy5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLmVsZW1lbnRzLmJhY2tncm91bmQuc3R5bGUuYmFja2dyb3VuZEltYWdlO1xuICB0aGlzLm9yaWdpbmFscy5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLmVsZW1lbnRzLmJhY2tncm91bmQuc3R5bGUuYmFja2dyb3VuZENvbG9yO1xuICB0aGlzLm9yaWdpbmFscy5icm93c2VyQ29udGFpbmVyQmFja2dyb3VuZCA9IHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5zdHlsZS5iYWNrZ3JvdW5kO1xuXG4gIHRoaXMuZWxlbWVudHMuYmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kID0gJ25vbmUnO1xuICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIuYmFja2dyb3VuZCA9ICdub25lJztcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLm9uRW5hYmxlID0gZnVuY3Rpb24oKSB7XG5cbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLm9uRGlzYWJsZSA9IGZ1bmN0aW9uKCkge1xuXG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5vbkxlZnRMb2NrU2NyZWVuID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCc+Pj4+IG9uIGxlZnQgbG9ja3NjcmVlbicpO1xuICB0aGlzLmxvYWREdW1teVNjcmVlbkxlZnQoKTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLm9uUmlnaHRMb2NrU2NyZWVuID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCc+Pj4+IG9uIHJpZ2h0IGxvY2tzY3JlZW4nKTtcbiAgdGhpcy5sb2FkRHVtbXlTY3JlZW5SaWdodCgpO1xufTtcblxuLypcbkNvbnRyb2xsZXIucHJvdG90eXBlLmhhbmRsZUV2ZW50ID0gZnVuY3Rpb24oZSkge1xuICAvLyBkZWJ1ZyBhdCBhaXJcbiAgLy8gdmFyIE1BTklGRVNUX1VSTCA9ICdhcHA6Ly9kOGRjNjBjMC1hN2IwLTAxNGItODY1OS1hZTU3Y2E3ZjVmY2EvbWFuaWZlc3Qud2ViYXBwJztcbiAgLy8gb25saW5lIHZlcnNpb25cbiAgdmFyIE1BTklGRVNUX1VSTCA9ICdodHRwczovL2dyZWctd2VuZy5naXRodWIuaW8vcmVwbGFjYWJsZS1sb2Nrc2NyZWVucy9tYW5pZmVzdC53ZWJhcHAnO1xuICBpZiAoZS5hcHBsaWNhdGlvbi5tYW5pZmVzdFVSTCAhPT0gTUFOSUZFU1RfVVJMKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgc3dpdGNoKGUudHlwZSkge1xuICAgIGNhc2UgJ2VuYWJsZWRzdGF0ZWNoYW5nZSc6XG4gICAgICBpZiAoZS5hcHBsaWNhdGlvbi5lbmFibGVkKSB7XG4gICAgICAgIHRoaXMubmV4dCh0aGlzLm9uRW5hYmxlLmJpbmQodGhpcykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5uZXh0KHRoaXMub25EaXNhYmxlLmJpbmQodGhpcykpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAndW5pbnN0YWxsJzpcbiAgICAgIHRoaXMubmV4dCh0aGlzLm9uVW5pbnN0YWxsLmJpbmQodGhpcykpO1xuICAgICAgYnJlYWs7XG4gIH1cbn07XG4qL1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5vblVuaW5zdGFsbCA9IGZ1bmN0aW9uKCkge1xuICBuYXZpZ2F0b3IubW96QXBwcy5tZ210LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2VuYWJsZWRzdGF0ZWNoYW5nZScsIHRoaXMpO1xuICBuYXZpZ2F0b3IubW96QXBwcy5tZ210LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3VuaW5zdGFsbCcsIHRoaXMpO1xufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL0NvbnRyb2xsZXIuanNcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbi8qIGdsb2JhbCBIYW1tZXIgKi9cblxuZXhwb3J0IGZ1bmN0aW9uIEdlc3R1cmVDb250cm9sbGVyKCkge31cbkdlc3R1cmVDb250cm9sbGVyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnF1ZXVlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIHRoaXMuc2V0dXBDb3ZlcigpO1xuICB2YXIgaGFtbWVyICAgID0gbmV3IEhhbW1lci5NYW5hZ2VyKHRoaXMuY292ZXIpO1xuICB2YXIgc3dpcGUgICAgID0gbmV3IEhhbW1lci5Td2lwZSgpO1xuICBoYW1tZXIuYWRkKHN3aXBlKTtcbiAgaGFtbWVyLm9uKCdzd2lwZWxlZnQnLCAoKSA9PiB7XG4gICAgY29uc29sZS5sb2coJzw8PDw8PCBsZWZ0Jyk7XG4gICAgdGhpcy5uZXh0KHRoaXMubGVmdEJpbmRlcnMpLm5leHQoKCkgPT4ge2NvbnNvbGUubG9nKCc8PDw8PDwgYWZ0ZXIgbGVmdCcpO30pO1xuICB9KTtcbiAgaGFtbWVyLm9uKCdzd2lwZXJpZ2h0JywgKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKCc+Pj4+PiByaWdodCcpO1xuICAgIHRoaXMubmV4dCh0aGlzLnJpZ2h0QmluZGVycykubmV4dCgoKSA9PiB7Y29uc29sZS5sb2coJz4+Pj4+PiBhZnRlciByaWdodCcpO30pO1xuICB9KTtcbiAgaGFtbWVyLm9uKCdzd2lwZXVwJywgKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdeXl5eXl5eIHVwJywgdGhpcy51cEJpbmRlcnMubGVuZ3RoKTtcbiAgICB0aGlzLm5leHQodGhpcy51cEJpbmRlcnMpLm5leHQoKCkgPT4ge2NvbnNvbGUubG9nKCdeXl5eXl5eXiBhZnRlciB1cCcpO30pO1xuICB9KTtcbiAgdGhpcy5sZWZ0QmluZGVycyA9IFtdO1xuICB0aGlzLnJpZ2h0QmluZGVycyA9IFtdO1xuICB0aGlzLnVwQmluZGVycyA9IFtdO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkdlc3R1cmVDb250cm9sbGVyLnByb3RvdHlwZS5zZXR1cENvdmVyID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuY292ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGhpcy5jb3Zlci5pZCA9ICdmb3hub2ItY292ZXInO1xuICAvLyBkZWJ1ZyBjb2xvclxuICAvL3RoaXMuY292ZXIuc3R5bGUuYmFja2dyb3VuZCA9ICdyZ2JhKDAsIDEwMCwgMCwgMC4xKSc7XG4gIHRoaXMuY292ZXIuc3R5bGUud2lkdGggPSAgJzEwMCUnO1xuICB0aGlzLmNvdmVyLnN0eWxlLmhlaWdodCA9ICc4MCUnO1xuICB0aGlzLmNvdmVyLnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgdGhpcy5jb3Zlci5zdHlsZS50b3AgPSAnNDBweCc7XG4gIHRoaXMuY292ZXIuc3R5bGUuekluZGV4ID0gJzgnO1xufTtcblxuR2VzdHVyZUNvbnRyb2xsZXIucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbihzdGVwcykge1xuICBpZiAoIUFycmF5LmlzQXJyYXkoc3RlcHMpKSB7XG4gICAgc3RlcHMgPSBbc3RlcHNdO1xuICB9XG4gIHZhciBzdGVwUHJvbWlzZXMgPSBzdGVwcy5tYXAoKHN0ZXApID0+IHtcbiAgICByZXR1cm4gc3RlcCgpO1xuICB9KTtcbiAgdGhpcy5xdWV1ZSA9IHRoaXMucXVldWUudGhlbigoKSA9PiB7XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHN0ZXBQcm9taXNlcyk7XG4gIH0pLmNhdGNoKGNvbnNvbGUuZXJyb3IuYmluZChjb25zb2xlKSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuR2VzdHVyZUNvbnRyb2xsZXIucHJvdG90eXBlLmJpbmRPbkxlZnQgPSBmdW5jdGlvbihjYikge1xuICB0aGlzLmxlZnRCaW5kZXJzLnB1c2goY2IpO1xufTtcblxuR2VzdHVyZUNvbnRyb2xsZXIucHJvdG90eXBlLmJpbmRPblJpZ2h0ID0gZnVuY3Rpb24oY2IpIHtcbiAgdGhpcy5yaWdodEJpbmRlcnMucHVzaChjYik7XG59O1xuXG5HZXN0dXJlQ29udHJvbGxlci5wcm90b3R5cGUuYmluZE9uVXAgPSBmdW5jdGlvbihjYikge1xuICB0aGlzLnVwQmluZGVycy5wdXNoKGNiKTtcbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9HZXN0dXJlQ29udHJvbGxlci5qc1xuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0IGZ1bmN0aW9uIFN0b3JlKCkge31cblN0b3JlLnByb3RvdHlwZS5mZXRjaERlZmF1bHQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2ZveG5vYi1kZWZhdWx0JykpO1xufTtcblxuU3RvcmUucHJvdG90eXBlLnN1Ym1pdERlZmF1bHQgPSBmdW5jdGlvbih1cmwsIGxvY2FsLCBwYXlsb2FkKSB7XG4gIGlmIChsb2NhbCkge1xuICAgIHVybCA9IHBheWxvYWQub3JpZ2luO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdmb3hub2ItZGVmYXVsdCcsXG4gICAgICBKU09OLnN0cmluZ2lmeSh7ICd1cmwnOiBwYXlsb2FkLm9yaWdpbiArICcvJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXlsb2FkLm1hbmlmZXN0LmxhdW5jaF9wYXRoICsgJyNzZWN1cmUnLFxuICAgICAgICAgICAgICAgICAgICAgJ21hbmlmZXN0JzogcGF5bG9hZC5tYW5pZmVzdFVSTCB9KSk7XG4gICAgY29uc29sZS5sb2coJz4+Pj4+Pj4gc3VibWl0bG9jYWxkZWZhdWx0OiAnLCBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnZm94bm9iLWRlZmF1bHQnKSk7XG4gIH0gZWxzZSB7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2ZveG5vYi1kZWZhdWx0JyxcbiAgICAgIEpTT04uc3RyaW5naWZ5KHsgJ3VybCc6IHVybCwgJ21hbmlmZXN0JzogbnVsbH0pKTtcbiAgfVxufTtcblxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvU3RvcmUuanNcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9