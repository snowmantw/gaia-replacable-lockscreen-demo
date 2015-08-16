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
	  this._errorCover = null;
	  this._waitingTimer = null;
	  this._store = new _srcStoreJs.Store();
	  this._configFrame = null;
	  this._waitingCover = null;
	  this._contentFrame = null;
	  this._appInstallZIndex = 1024;
	  console.log('>>>> try to launch addon');
	  // TODO: 1. if we have settings to know how many LSW could be injected,
	  //          read it here.
	  //       2. some dummy function need to be filled later.
	  this.queue = new Promise(function (resolve, reject) {
	    _this.elements = {};
	    _this.originals = {};
	    // TODO: should read config here
	    resolve();
	  }).then(this.setupEvents.bind(this)).then(this.label.bind(this, '>>> launching')).then(this.waitLockScreen.bind(this)).then(this.label.bind(this, '>>> wait lockscreen done')).then(this.setupElements.bind(this)).then(this.label.bind(this, '>>> set elements done')).then(this.setupGesture.bind(this)).then(this.label.bind(this, '>>> set gesture done'))
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
	      evt.stopPropagation();
	      // TODO: can preview the UI before apply that:
	      // add a field in the hash.
	      console.log('>>>>>>> locationchanged', evt);
	      var url = evt.detail;
	      var hash = url.replace(/^.*#/, '');
	      var screenNameParsed = hash.match(/screenname-(.*)/);
	      var commandParsed = hash.match(/command-(.*)/);
	      var installParsed = hash.match(/install-(.*)/);
	      console.log('>>>>>> url:', url, hash, screenNameParsed, commandParsed);
	      if (null !== screenNameParsed) {
	        this.next(this.onScreenChange.bind(this, screenNameParsed[1]));
	      } else if (null !== commandParsed) {
	        this.next(this.onConfigCommand.bind(this, commandParsed[1]));
	      } else if (null !== installParsed) {
	        this.next(this.onInstall.bind(this, installParsed[1]));
	      } else {
	        // loaded.
	        this.removeWaitingCover();
	        console.log('>>>>> to removeWaiting and open the config');
	        this.next(this.onConfigOpened.bind(this));
	      }
	      break;
	    case 'click':
	      console.log('>>>>>> click event: ', this._waitingCover, this._errorCover);
	      if (this._waitingCover && evt.target === this._waitingCover) {
	        this.elements.browserContainer.removeChild(this._waitingCover);
	        this._waitingCover = null;
	        if (this._configFrame) {
	          this.elements.browserContainer.removeChild(this._configFrame);
	          this._configFrame = null;
	        }
	        return;
	      }
	      if (this._errorCover && evt.target === this._errorCover) {
	        this.elements.browserContainer.removeChild(this._errorCover);
	        this._errorCover = null;
	      }
	  }
	};
	
	Controller.prototype.onConfigCommand = function (command) {
	  if ('cancel' === command) {
	    if (null !== this._configFrame) {
	      this.elements.browserContainer.removeChild(this._configFrame);
	      document.querySelector('#statusbar').style.display = 'block';
	      this._configFrame = null;
	    } else {
	      console.log('>>>>>>> cant remove it');
	    }
	  }
	};
	
	Controller.prototype.onInstall = function (strprogress) {
	  var progress = JSON.parse(decodeURIComponent(strprogress));
	  var dialog;
	  console.log('>>>>>>>> onInstall: ', progress);
	  if ('start' === progress.stage) {
	    dialog = document.querySelector('#app-install-dialog');
	    if (!dialog) {
	      throw new Error('no install dialog while installing');
	    }
	    this._appInstallZIndex = dialog.style.zIndex;
	    dialog.style.zIndex = 65537;
	  } else if ('done' === progress.stage || 'error' === progress.stage) {
	    dialog = document.querySelector('#app-install-dialog');
	    if (!dialog) {
	      throw new Error('no install dialog after installing');
	    }
	    dialog.style.zIndex = this._appInstallZIndex;
	    // XXX: can't invoke an app just after install it.
	    // I suspect it's a bug but I don't have better way to do that.
	    this.tryDelayInvoke(progress.name);
	  }
	};
	
	Controller.prototype.tryDelayInvoke = function (name) {
	  var _this3 = this;
	
	  setTimeout(function () {
	    console.log('>>>>>> progress invoke installed: name: ', name);
	    console.log('>>>>>> delay invoke: ');
	    try {
	      _this3.invokeInstalled(name);
	    } catch (e) {
	      // XXX: can't invoke an app just after install it (~3 or 5 seconds).
	      // I suspect it's a bug but I don't have better way to do that.
	      console.error('>>>>>>> try delay invoke again', name);
	      _this3.tryDelayInvoke();
	    }
	    console.log('>>>>>> progress done: name: ', name);
	  }, 200);
	};
	
	Controller.prototype.next = function (steps) {
	  if (!Array.isArray(steps)) {
	    steps = [steps];
	  }
	  var stepPromises = steps.map(function (step) {
	    return step();
	  });
	  this.queue = this.queue.then(function () {
	    return Promise.all(stepPromises)['catch'](function (err) {
	      console.error('>>>> Error in inner steps', err);
	      throw err;
	    });
	  })['catch'](function (err) {
	    console.error('>>>> catch error in next', err);
	    throw err;
	  });
	  return this;
	};
	
	Controller.prototype.onConfigOpened = function () {
	  if (this._waitingTimer) {
	    clearTimeout(this._waitingTimer);
	  }
	};
	
	Controller.prototype.invokeInstalled = function (name) {
	  var _this4 = this;
	
	  console.log('>>>>>> try to invoke: ', name);
	  return this.fromNameToInstalled(name).then(function (appinfo) {
	    if (appinfo) {
	      _this4._store.submitDefault(name, true, appinfo);
	      if (_this4._configFrame) {
	        _this4.elements.browserContainer.removeChild(_this4._configFrame);
	        _this4._configFrame = null;
	      }
	      if (_this4._contentFrame) {
	        _this4.elements.browserContainer.removeChild(_this4._contentFrame);
	        _this4._contentFrame = null;
	      }
	      _this4.loadDefault();
	    } else {
	      console.error('No such content: ', name);
	    }
	  })['catch'](function (err) {
	    console.error(err);
	  });
	};
	
	Controller.prototype.onScreenChange = function (parsed) {
	  var screenurl = decodeURIComponent(parsed);
	  var local = null === screenurl.match(/^http/);
	  console.log('>>>>> onScreenChange: ', parsed, local, screenurl);
	  if (local) {
	    var name = screenurl;
	    this.invokeInstalled(name);
	    document.querySelector('#statusbar').style.display = 'block';
	  } else {
	    this._store.submitDefault(screenurl, local);
	    if (this._configFrame) {
	      this.elements.browserContainer.removeChild(this._configFrame);
	      document.querySelector('#statusbar').style.display = 'block';
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
	  var _this5 = this;
	
	  return Promise.resolve().then(function () {
	    console.log('>>>>>> showWaitingCover');
	    var cover = document.createElement('div');
	    cover.textContent = 'Waiting...';
	    cover.id = 'foxnob-waiting-cover';
	    cover.style.position = 'fixed';
	    cover.style.zIndex = '65538';
	    cover.style.justifyContent = 'center';
	    cover.style.alignItems = 'center';
	    cover.style.display = 'flex';
	    cover.style.width = '100%';
	    cover.style.height = '100%';
	    cover.style.background = 'wheat';
	    cover.style.color = '#333333';
	    cover.style.fontSize = '4rem';
	    _this5._waitingCover = cover;
	    _this5.elements.browserContainer.appendChild(cover);
	  });
	};
	
	Controller.prototype.removeWaitingCover = function () {
	  var _this6 = this;
	
	  return Promise.resolve().then(function () {
	    _this6.elements.browserContainer.removeChild(_this6._waitingCover);
	    _this6._waitingCover = null;
	  });
	};
	
	Controller.prototype.onOpenConfig = function () {
	  var _this7 = this;
	
	  console.log('>>>>>>>>> onOpenConfig');
	  var url = 'https://foxknob.herokuapp.com/#';
	  this.next(function () {
	    return _this7.assertConnection().then(function (result) {
	      console.log('>>>>>>> assert connection successed', result);
	    })['catch'](function (err) {
	      console.log('>>>>>> onOpenConfig in connection error');
	      _this7.promptNoConnection(url);
	      throw err;
	    });
	  }).next(this.showWaitingCover.bind(this)).next(function () {
	    return Promise.resolve().then(function () {
	      console.log('>>>>> open config create frame', _this7._configFrame);
	      if (_this7._configFrame) {
	        // Remove the old config frame.
	        _this7.elements.browserContainer.removeChild(_this7._configFrame);
	        _this7._configFrame = null;
	      }
	      _this7._waitingTimer = setTimeout(_this7.onWaintingScreenTimeout, _this7.SCREEN_TIMEOUT);
	      console.log('>>>>> set timeout');
	      var iframe = _this7.createScreenFrame();
	      iframe.classList.add('foxnob-config');
	      iframe.style.zIndex = '65535';
	      iframe.src = url;
	      document.querySelector('#statusbar').style.display = 'none';
	      _this7._configFrame = iframe;
	      console.log('>>>>> append');
	      _this7.elements.browserContainer.appendChild(iframe);
	      console.log('>>>>>> add event listener location now');
	      iframe.addEventListener('mozbrowserlocationchange', _this7);
	      console.log('>>>>> done');
	    });
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
	  console.log('>>>>>> no connection');
	  var cover = document.createElement('div');
	  cover.textContent = 'No Connection! [x]';
	  cover.id = 'foxnob-waiting-cover';
	  cover.style.position = 'fixed';
	  cover.style.zIndex = '65538';
	  cover.style.justifyContent = 'center';
	  cover.style.alignItems = 'center';
	  cover.style.display = 'flex';
	  cover.style.width = '100%';
	  cover.style.height = '100%';
	  cover.style.background = 'wheat';
	  cover.style.color = '#333333';
	  cover.style.fontSize = '2rem';
	  this._errorCover = cover;
	  this.elements.browserContainer.appendChild(cover);
	};
	
	Controller.prototype.loadDefault = function () {
	  var _this8 = this;
	
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
	      _this8._contentFrame = iframe;
	      _this8.elements.browserContainer.appendChild(iframe);
	    })['catch'](function () {
	      _this8.promptNoConnection(url);
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
	      if (app.manifest) {
	        return name === app.manifest.name;
	      } else {
	        return false;
	      }
	    })[0];
	  });
	};
	
	Controller.prototype.assertConnection = function () {
	  var lock = navigator.mozSettings.createLock();
	  var wifi = lock.get('wifi.enabled').then(function (r) {
	    return r['wifi.enabled'];
	  });
	  var rildata = lock.get('ril.data.enabled').then(function (r) {
	    return r['ril.data.enabled'];
	  });
	  return Promise.all([wifi, rildata]).then(function (rs) {
	    if (rs[0] || rs[1]) {
	      return true;
	    } else {
	      console.error('No connection: ', rs[0], rs[1]);
	      throw new Error('No connection: ');
	    }
	  });
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
	  //navigator.mozApps.mgmt.addEventListener('enabledstatechange', this);
	  //navigator.mozApps.mgmt.addEventListener('uninstall', this);
	  window.addEventListener('click', this);
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
	    localStorage.setItem('foxnob-default', JSON.stringify({ 'url': payload.origin + payload.manifest.launch_path + '#secure',
	      'manifest': payload.manifestURL }));
	    console.log('>>>>>>> submitlocaldefault: ', localStorage.getItem('foxnob-default'));
	  } else {
	    localStorage.setItem('foxnob-default', JSON.stringify({ 'url': url, 'manifest': null }));
	    console.log('>>>>>>> submitNOTDefault: ', localStorage.getItem('foxnob-default'));
	  }
	};

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgODQzYzYzOTIyOWM1N2IxNWQzMDEiLCJ3ZWJwYWNrOi8vLy4vc3JjL1N0YXJ0dXAuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL0NvbnRyb2xsZXIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL0dlc3R1cmVDb250cm9sbGVyLmpzIiwid2VicGFjazovLy8uL3NyYy9TdG9yZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7OztBQ3RDQSxhQUFZLENBQUM7OzRDQUNjLENBQW1COztBQUM5QyxFQUFDLFlBQVk7QUFDWCxXQUFRLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLEVBQUUsU0FBUyxnQkFBZ0IsR0FBRztBQUN4RSxZQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDakMsU0FBSSxNQUFNLEdBQUUscUJBSlAsVUFBVSxFQUlhLENBQUM7QUFDN0IsV0FBTSxDQUFDLEtBQUssRUFBRSxDQUFDOzs7Ozs7Ozs7SUFTaEIsQ0FBQyxDQUFDO0VBQ0osR0FBRyxDOzs7Ozs7QUNoQkosYUFBWSxDQUFDOzs7O1NBR0csVUFBVSxHQUFWLFVBQVU7O21EQUZRLENBQTBCOzt1Q0FDdEMsQ0FBYzs7QUFDN0IsVUFBUyxVQUFVLEdBQUcsRUFBRTs7QUFDL0IsV0FBVSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsWUFBVzs7O0FBQ3RDLE9BQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO0FBQ3pCLE9BQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0FBQ3hCLE9BQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO0FB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NUQsT0FBSSxLQUFLLEVBQUU7QUFDVCxRQUFHLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztBQUNyQixpQkFBWSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFDbkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsV0FBVyxHQUFHLFNBQVM7QUFDbEUsaUJBQVUsRUFBRSxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3JELFlBQU8sQ0FBQyxHQUFHLENBQUMsOEJBQThCLEVBQUUsWUFBWSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7SUFDckYsTUFBTTtBQUNMLGlCQUFZLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUNuQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25ELFlBQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLEVBQUUsWUFBWSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7SUFDbkY7RUFDRixDIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svYm9vdHN0cmFwIDg0M2M2MzkyMjljNTdiMTVkMzAxXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuaW1wb3J0IHsgQ29udHJvbGxlciB9IGZyb20gJ3NyYy9Db250cm9sbGVyLmpzJztcbihmdW5jdGlvbiAoKSB7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3JlYWR5c3RhdGVjaGFuZ2UnLCBmdW5jdGlvbiByZWFkeVN0YXRlQ2hhbmdlKCkge1xuICAgIGNvbnNvbGUubG9nKCc+Pj4+Pj4+PiBpbiBhZGRvbicpO1xuICAgIHZhciBmb3hub2I9IG5ldyBDb250cm9sbGVyKCk7XG4gICAgZm94bm9iLnN0YXJ0KCk7XG4gICAgLypcbiAgICBjb25zb2xlLmxvZygnPj4+Pj4+Pj4gaW4gYWRkb24nKTtcbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2ludGVyYWN0aXZlJykge1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVhZHlzdGF0ZWNoYW5nZScsIHJlYWR5U3RhdGVDaGFuZ2UpO1xuICAgICAgdmFyIGZveG5vYj0gbmV3IENvbnRyb2xsZXIoKTtcbiAgICAgIGZveG5vYi5zdGFydCgpO1xuICAgIH1cbiAgICAqL1xuICB9KTtcbn0pKCk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9TdGFydHVwLmpzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuaW1wb3J0IHsgR2VzdHVyZUNvbnRyb2xsZXIgfSBmcm9tICdzcmMvR2VzdHVyZUNvbnRyb2xsZXIuanMnO1xuaW1wb3J0IHsgU3RvcmUgfSBmcm9tICdzcmMvU3RvcmUuanMnO1xuZXhwb3J0IGZ1bmN0aW9uIENvbnRyb2xsZXIoKSB7fVxuQ29udHJvbGxlci5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5TQ1JFRU5fVElNRU9VVCA9IDMwO1xuICB0aGlzLl9lcnJvckNvdmVyID0gbnVsbDtcbiAgdGhpcy5fd2FpdGluZ1RpbWVyID0gbnVsbDtcbiAgdGhpcy5fc3RvcmUgPSBuZXcgU3RvcmUoKTtcbiAgdGhpcy5fY29uZmlnRnJhbWUgPSBudWxsO1xuICB0aGlzLl93YWl0aW5nQ292ZXIgPSBudWxsO1xuICB0aGlzLl9jb250ZW50RnJhbWUgPSBudWxsO1xuICB0aGlzLl9hcHBJbnN0YWxsWkluZGV4ID0gMTAyNDtcbiAgY29uc29sZS5sb2coJz4+Pj4gdHJ5IHRvIGxhdW5jaCBhZGRvbicpO1xuICAvLyBUT0RPOiAxLiBpZiB3ZSBoYXZlIHNldHRpbmdzIHRvIGtub3cgaG93IG1hbnkgTFNXIGNvdWxkIGJlIGluamVjdGVkLFxuICAvLyAgICAgICAgICByZWFkIGl0IGhlcmUuXG4gIC8vICAgICAgIDIuIHNvbWUgZHVtbXkgZnVuY3Rpb24gbmVlZCB0byBiZSBmaWxsZWQgbGF0ZXIuXG4gIHRoaXMucXVldWUgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLmVsZW1lbnRzID0ge307XG4gICAgICB0aGlzLm9yaWdpbmFscyA9IHt9O1xuICAgICAgLy8gVE9ETzogc2hvdWxkIHJlYWQgY29uZmlnIGhlcmVcbiAgICAgIHJlc29sdmUoKTtcbiAgICB9KVxuICAgIC50aGVuKHRoaXMuc2V0dXBFdmVudHMuYmluZCh0aGlzKSkudGhlbih0aGlzLmxhYmVsLmJpbmQodGhpcywgJz4+PiBsYXVuY2hpbmcnKSlcbiAgICAudGhlbih0aGlzLndhaXRMb2NrU2NyZWVuLmJpbmQodGhpcykpLnRoZW4odGhpcy5sYWJlbC5iaW5kKHRoaXMsICc+Pj4gd2FpdCBsb2Nrc2NyZWVuIGRvbmUnKSlcbiAgICAudGhlbih0aGlzLnNldHVwRWxlbWVudHMuYmluZCh0aGlzKSkudGhlbih0aGlzLmxhYmVsLmJpbmQodGhpcywgJz4+PiBzZXQgZWxlbWVudHMgZG9uZScpKVxuICAgIC50aGVuKHRoaXMuc2V0dXBHZXN0dXJlLmJpbmQodGhpcykpLnRoZW4odGhpcy5sYWJlbC5iaW5kKHRoaXMsICc+Pj4gc2V0IGdlc3R1cmUgZG9uZScpKVxuLy8gICAgLnRoZW4odGhpcy5sb2FkRGVmYXVsdC5iaW5kKHRoaXMpKS50aGVuKHRoaXMubGFiZWwuYmluZCh0aGlzLCAnPj4+IGxvYWQgZGVmYXVsdCBvbmUnKSlcbiAgICAuY2F0Y2godGhpcy5vbk1haW5Qcm9taXNlRXJyb3IuYmluZCh0aGlzKSk7XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5sYWJlbCA9IGZ1bmN0aW9uKGxiKSB7XG4gIGNvbnNvbGUubG9nKGxiKTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLm9uTWFpblByb21pc2VFcnJvciA9IGZ1bmN0aW9uKGVycikge1xuICBjb25zb2xlLmVycm9yKCc+Pj4gQ29udHJvbGxlciBFcnJvcjogJywgZXJyKTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLnNldHVwR2VzdHVyZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9nZXN0dXJlQ29udHJvbGxlciA9IG5ldyBHZXN0dXJlQ29udHJvbGxlcigpO1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHRoaXMuX2dlc3R1cmVDb250cm9sbGVyLnN0YXJ0KClcbiAgICAubmV4dCgoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnPj4+PiBiaW5kIGdlc3R1cmUgaW4gQ29udHJvbGxlcicpO1xuICAgICAgdGhpcy5fZ2VzdHVyZUNvbnRyb2xsZXIuYmluZE9uTGVmdCh0aGlzLm9uTGVmdExvY2tTY3JlZW4uYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLl9nZXN0dXJlQ29udHJvbGxlci5iaW5kT25SaWdodCh0aGlzLm9uUmlnaHRMb2NrU2NyZWVuLmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5fZ2VzdHVyZUNvbnRyb2xsZXIuYmluZE9uVXAodGhpcy5vbk9wZW5Db25maWcuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5fZ2VzdHVyZUNvbnRyb2xsZXIuY292ZXIpO1xuICAgIH0pXG4gICAgLm5leHQoKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJz4+Pj4gZW5kaW5nIGdlc3R1cmUgc2V0dXAgaW4gQ29udHJvbGxlcicpO1xuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0pO1xuICB9KTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLmhhbmRsZUV2ZW50ID0gZnVuY3Rpb24oZXZ0KSB7XG4gIHN3aXRjaCAoZXZ0LnR5cGUpIHtcbiAgICBjYXNlICdtb3picm93c2VybG9jYXRpb25jaGFuZ2UnOlxuICAgICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgLy8gVE9ETzogY2FuIHByZXZpZXcgdGhlIFVJIGJlZm9yZSBhcHBseSB0aGF0OlxuICAgICAgLy8gYWRkIGEgZmllbGQgaW4gdGhlIGhhc2guXG4gICAgICBjb25zb2xlLmxvZygnPj4+Pj4+PiBsb2NhdGlvbmNoYW5nZWQnLCBldnQpO1xuICAgICAgdmFyIHVybCA9IGV2dC5kZXRhaWw7XG4gICAgICB2YXIgaGFzaCA9IHVybC5yZXBsYWNlKC9eLiojLywgJycpO1xuICAgICAgdmFyIHNjcmVlbk5hbWVQYXJzZWQgPSBoYXNoLm1hdGNoKC9zY3JlZW5uYW1lLSguKikvKTtcbiAgICAgIHZhciBjb21tYW5kUGFyc2VkID0gaGFzaC5tYXRjaCgvY29tbWFuZC0oLiopLyk7XG4gICAgICB2YXIgaW5zdGFsbFBhcnNlZCA9IGhhc2gubWF0Y2goL2luc3RhbGwtKC4qKS8pO1xuICAgICAgY29uc29sZS5sb2coJz4+Pj4+PiB1cmw6JywgdXJsLCBoYXNoLCBzY3JlZW5OYW1lUGFyc2VkLCBjb21tYW5kUGFyc2VkKTtcbiAgICAgIGlmIChudWxsICE9PSBzY3JlZW5OYW1lUGFyc2VkKSB7XG4gICAgICAgIHRoaXMubmV4dCh0aGlzLm9uU2NyZWVuQ2hhbmdlLmJpbmQodGhpcywgc2NyZWVuTmFtZVBhcnNlZFsxXSkpO1xuICAgICAgfSBlbHNlIGlmKG51bGwgIT09IGNvbW1hbmRQYXJzZWQpIHtcbiAgICAgICAgdGhpcy5uZXh0KHRoaXMub25Db25maWdDb21tYW5kLmJpbmQodGhpcywgY29tbWFuZFBhcnNlZFsxXSkpO1xuICAgICAgfSBlbHNlIGlmIChudWxsICE9PSBpbnN0YWxsUGFyc2VkKSB7XG4gICAgICAgIHRoaXMubmV4dCh0aGlzLm9uSW5zdGFsbC5iaW5kKHRoaXMsIGluc3RhbGxQYXJzZWRbMV0pKTtcbiAgICAgIH0gZWxzZSB7ICAvLyBsb2FkZWQuXG4gICAgICAgIHRoaXMucmVtb3ZlV2FpdGluZ0NvdmVyKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCc+Pj4+PiB0byByZW1vdmVXYWl0aW5nIGFuZCBvcGVuIHRoZSBjb25maWcnKTtcbiAgICAgICAgdGhpcy5uZXh0KHRoaXMub25Db25maWdPcGVuZWQuYmluZCh0aGlzKSk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjbGljayc6XG4gICAgICBjb25zb2xlLmxvZygnPj4+Pj4+IGNsaWNrIGV2ZW50OiAnLCB0aGlzLl93YWl0aW5nQ292ZXIsIHRoaXMuX2Vycm9yQ292ZXIpO1xuICAgICAgaWYgKHRoaXMuX3dhaXRpbmdDb3ZlciAmJiBldnQudGFyZ2V0ID09PSB0aGlzLl93YWl0aW5nQ292ZXIpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuX3dhaXRpbmdDb3Zlcik7XG4gICAgICAgIHRoaXMuX3dhaXRpbmdDb3ZlciA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLl9jb25maWdGcmFtZSkge1xuICAgICAgICAgIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5yZW1vdmVDaGlsZCh0aGlzLl9jb25maWdGcmFtZSk7XG4gICAgICAgICAgdGhpcy5fY29uZmlnRnJhbWUgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9lcnJvckNvdmVyICYmIGV2dC50YXJnZXQgPT09IHRoaXMuX2Vycm9yQ292ZXIpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuX2Vycm9yQ292ZXIpO1xuICAgICAgICB0aGlzLl9lcnJvckNvdmVyID0gbnVsbDtcbiAgICAgIH1cbiAgfVxufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUub25Db25maWdDb21tYW5kID0gZnVuY3Rpb24oY29tbWFuZCkge1xuICBpZiAoJ2NhbmNlbCcgPT09IGNvbW1hbmQpIHtcbiAgICBpZiAobnVsbCAhPT0gdGhpcy5fY29uZmlnRnJhbWUpIHtcbiAgICAgIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5yZW1vdmVDaGlsZCh0aGlzLl9jb25maWdGcmFtZSk7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc3RhdHVzYmFyJykuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICB0aGlzLl9jb25maWdGcmFtZSA9IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4+Pj4+IGNhbnQgcmVtb3ZlIGl0Jyk7XG4gICAgfVxuICB9XG59O1xuXG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLm9uSW5zdGFsbCA9IGZ1bmN0aW9uKHN0cnByb2dyZXNzKSB7XG4gIHZhciBwcm9ncmVzcyA9IEpTT04ucGFyc2UoZGVjb2RlVVJJQ29tcG9uZW50KHN0cnByb2dyZXNzKSk7XG4gIHZhciBkaWFsb2c7XG4gIGNvbnNvbGUubG9nKCc+Pj4+Pj4+PiBvbkluc3RhbGw6ICcsIHByb2dyZXNzKTtcbiAgaWYgKCdzdGFydCcgPT09IHByb2dyZXNzLnN0YWdlKSB7XG4gICAgZGlhbG9nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FwcC1pbnN0YWxsLWRpYWxvZycpO1xuICAgIGlmICghZGlhbG9nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIGluc3RhbGwgZGlhbG9nIHdoaWxlIGluc3RhbGxpbmcnKTtcbiAgICB9XG4gICAgdGhpcy5fYXBwSW5zdGFsbFpJbmRleCA9IGRpYWxvZy5zdHlsZS56SW5kZXg7XG4gICAgZGlhbG9nLnN0eWxlLnpJbmRleCA9IDY1NTM3O1xuICB9IGVsc2UgaWYgKCdkb25lJyA9PT0gcHJvZ3Jlc3Muc3RhZ2UgfHwgJ2Vycm9yJyA9PT0gcHJvZ3Jlc3Muc3RhZ2UpIHtcbiAgICBkaWFsb2cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYXBwLWluc3RhbGwtZGlhbG9nJyk7XG4gICAgaWYgKCFkaWFsb2cpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gaW5zdGFsbCBkaWFsb2cgYWZ0ZXIgaW5zdGFsbGluZycpO1xuICAgIH1cbiAgICBkaWFsb2cuc3R5bGUuekluZGV4ID0gdGhpcy5fYXBwSW5zdGFsbFpJbmRleDtcbiAgICAvLyBYWFg6IGNhbid0IGludm9rZSBhbiBhcHAganVzdCBhZnRlciBpbnN0YWxsIGl0LlxuICAgIC8vIEkgc3VzcGVjdCBpdCdzIGEgYnVnIGJ1dCBJIGRvbid0IGhhdmUgYmV0dGVyIHdheSB0byBkbyB0aGF0LlxuICAgIHRoaXMudHJ5RGVsYXlJbnZva2UocHJvZ3Jlc3MubmFtZSk7XG4gIH1cbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLnRyeURlbGF5SW52b2tlID0gZnVuY3Rpb24obmFtZSkge1xuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBjb25zb2xlLmxvZygnPj4+Pj4+IHByb2dyZXNzIGludm9rZSBpbnN0YWxsZWQ6IG5hbWU6ICcsIG5hbWUpO1xuICAgIGNvbnNvbGUubG9nKCc+Pj4+Pj4gZGVsYXkgaW52b2tlOiAnKTtcbiAgICB0cnkge1xuICAgICAgdGhpcy5pbnZva2VJbnN0YWxsZWQobmFtZSk7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICAvLyBYWFg6IGNhbid0IGludm9rZSBhbiBhcHAganVzdCBhZnRlciBpbnN0YWxsIGl0ICh+MyBvciA1IHNlY29uZHMpLlxuICAgICAgLy8gSSBzdXNwZWN0IGl0J3MgYSBidWcgYnV0IEkgZG9uJ3QgaGF2ZSBiZXR0ZXIgd2F5IHRvIGRvIHRoYXQuXG4gICAgICBjb25zb2xlLmVycm9yKCc+Pj4+Pj4+IHRyeSBkZWxheSBpbnZva2UgYWdhaW4nLCBuYW1lKTtcbiAgICAgIHRoaXMudHJ5RGVsYXlJbnZva2UoKTtcbiAgICB9XG4gICAgY29uc29sZS5sb2coJz4+Pj4+PiBwcm9ncmVzcyBkb25lOiBuYW1lOiAnLCBuYW1lKTtcbiAgfSwgMjAwKTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbihzdGVwcykge1xuICBpZiAoIUFycmF5LmlzQXJyYXkoc3RlcHMpKSB7XG4gICAgc3RlcHMgPSBbc3RlcHNdO1xuICB9XG4gIHZhciBzdGVwUHJvbWlzZXMgPSBzdGVwcy5tYXAoKHN0ZXApID0+IHtcbiAgICByZXR1cm4gc3RlcCgpO1xuICB9KTtcbiAgdGhpcy5xdWV1ZSA9IHRoaXMucXVldWUudGhlbigoKSA9PiB7XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHN0ZXBQcm9taXNlcykuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcignPj4+PiBFcnJvciBpbiBpbm5lciBzdGVwcycsIGVycik7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfSk7XG4gIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICBjb25zb2xlLmVycm9yKCc+Pj4+IGNhdGNoIGVycm9yIGluIG5leHQnLCBlcnIpO1xuICAgIHRocm93IGVycjtcbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUub25Db25maWdPcGVuZWQgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuX3dhaXRpbmdUaW1lcikge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLl93YWl0aW5nVGltZXIpO1xuICB9XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5pbnZva2VJbnN0YWxsZWQgPSBmdW5jdGlvbihuYW1lKSB7XG4gIGNvbnNvbGUubG9nKCc+Pj4+Pj4gdHJ5IHRvIGludm9rZTogJywgbmFtZSk7XG4gIHJldHVybiB0aGlzLmZyb21OYW1lVG9JbnN0YWxsZWQobmFtZSlcbiAgICAudGhlbigoYXBwaW5mbykgPT4ge1xuICAgICAgaWYgKGFwcGluZm8pIHtcbiAgICAgICAgdGhpcy5fc3RvcmUuc3VibWl0RGVmYXVsdChuYW1lLCB0cnVlLCBhcHBpbmZvKTtcbiAgICAgICAgaWYgKHRoaXMuX2NvbmZpZ0ZyYW1lKSB7XG4gICAgICAgICAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuX2NvbmZpZ0ZyYW1lKTtcbiAgICAgICAgICB0aGlzLl9jb25maWdGcmFtZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2NvbnRlbnRGcmFtZSkge1xuICAgICAgICAgIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5yZW1vdmVDaGlsZCh0aGlzLl9jb250ZW50RnJhbWUpO1xuICAgICAgICAgIHRoaXMuX2NvbnRlbnRGcmFtZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sb2FkRGVmYXVsdCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignTm8gc3VjaCBjb250ZW50OiAnLCBuYW1lKTtcbiAgICAgIH1cbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfSk7XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5vblNjcmVlbkNoYW5nZSA9IGZ1bmN0aW9uKHBhcnNlZCkge1xuICB2YXIgc2NyZWVudXJsID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhcnNlZCk7XG4gIHZhciBsb2NhbCA9IChudWxsID09PSBzY3JlZW51cmwubWF0Y2goL15odHRwLykpO1xuICBjb25zb2xlLmxvZygnPj4+Pj4gb25TY3JlZW5DaGFuZ2U6ICcsIHBhcnNlZCwgbG9jYWwsIHNjcmVlbnVybCk7XG4gIGlmIChsb2NhbCkge1xuICAgIHZhciBuYW1lID0gc2NyZWVudXJsO1xuICAgIHRoaXMuaW52b2tlSW5zdGFsbGVkKG5hbWUpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzdGF0dXNiYXInKS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgfSBlbHNlIHtcbiAgICB0aGlzLl9zdG9yZS5zdWJtaXREZWZhdWx0KHNjcmVlbnVybCwgbG9jYWwpO1xuICAgIGlmICh0aGlzLl9jb25maWdGcmFtZSkge1xuICAgICAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuX2NvbmZpZ0ZyYW1lKTtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzdGF0dXNiYXInKS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgIHRoaXMuX2NvbmZpZ0ZyYW1lID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX2NvbnRlbnRGcmFtZSkge1xuICAgICAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuX2NvbnRlbnRGcmFtZSk7XG4gICAgICB0aGlzLl9jb250ZW50RnJhbWUgPSBudWxsO1xuICAgIH1cbiAgICB0aGlzLmxvYWREZWZhdWx0KCk7XG4gIH1cbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLm9uV2FpbnRpbmdTY3JlZW5UaW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gIC8vIFRPRE86IHNob3cgZmFpbHVyZSBhbmQgcmVtb3ZlIHRoZSBtZXNzYWdlIGFuZCBjb3Zlci5cbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLnNob3dXYWl0aW5nQ292ZXIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKCc+Pj4+Pj4gc2hvd1dhaXRpbmdDb3ZlcicpO1xuICAgIHZhciBjb3ZlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGNvdmVyLnRleHRDb250ZW50ID0gJ1dhaXRpbmcuLi4nO1xuICAgIGNvdmVyLmlkID0gJ2ZveG5vYi13YWl0aW5nLWNvdmVyJztcbiAgICBjb3Zlci5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gICAgY292ZXIuc3R5bGUuekluZGV4ID0gJzY1NTM4JztcbiAgICBjb3Zlci5zdHlsZS5qdXN0aWZ5Q29udGVudCA9ICdjZW50ZXInO1xuICAgIGNvdmVyLnN0eWxlLmFsaWduSXRlbXMgPSAnY2VudGVyJztcbiAgICBjb3Zlci5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgIGNvdmVyLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICAgIGNvdmVyLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcbiAgICBjb3Zlci5zdHlsZS5iYWNrZ3JvdW5kID0gJ3doZWF0JztcbiAgICBjb3Zlci5zdHlsZS5jb2xvciA9ICcjMzMzMzMzJztcbiAgICBjb3Zlci5zdHlsZS5mb250U2l6ZSA9ICc0cmVtJztcbiAgICB0aGlzLl93YWl0aW5nQ292ZXIgPSBjb3ZlcjtcbiAgICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIuYXBwZW5kQ2hpbGQoY292ZXIpO1xuICB9KTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLnJlbW92ZVdhaXRpbmdDb3ZlciA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuX3dhaXRpbmdDb3Zlcik7XG4gICAgdGhpcy5fd2FpdGluZ0NvdmVyID0gbnVsbDtcbiAgfSk7XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5vbk9wZW5Db25maWcgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJz4+Pj4+Pj4+PiBvbk9wZW5Db25maWcnKTtcbiAgdmFyIHVybCA9ICdodHRwczovL2ZveGtub2IuaGVyb2t1YXBwLmNvbS8jJztcbiAgdGhpcy5uZXh0KCgpID0+IHtcbiAgICByZXR1cm4gdGhpcy5hc3NlcnRDb25uZWN0aW9uKCkudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnPj4+Pj4+PiBhc3NlcnQgY29ubmVjdGlvbiBzdWNjZXNzZWQnLCByZXN1bHQpO1xuICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4+Pj4gb25PcGVuQ29uZmlnIGluIGNvbm5lY3Rpb24gZXJyb3InKTtcbiAgICAgIHRoaXMucHJvbXB0Tm9Db25uZWN0aW9uKHVybCk7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfSk7XG4gIH0pXG4gIC5uZXh0KHRoaXMuc2hvd1dhaXRpbmdDb3Zlci5iaW5kKHRoaXMpKVxuICAubmV4dCgoKSA9PiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJz4+Pj4+IG9wZW4gY29uZmlnIGNyZWF0ZSBmcmFtZScsIHRoaXMuX2NvbmZpZ0ZyYW1lKTtcbiAgICAgIGlmICh0aGlzLl9jb25maWdGcmFtZSkge1xuICAgICAgICAvLyBSZW1vdmUgdGhlIG9sZCBjb25maWcgZnJhbWUuXG4gICAgICAgIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5yZW1vdmVDaGlsZCh0aGlzLl9jb25maWdGcmFtZSk7XG4gICAgICAgIHRoaXMuX2NvbmZpZ0ZyYW1lID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3dhaXRpbmdUaW1lciA9XG4gICAgICAgIHNldFRpbWVvdXQodGhpcy5vbldhaW50aW5nU2NyZWVuVGltZW91dCwgdGhpcy5TQ1JFRU5fVElNRU9VVCk7XG4gICAgICBjb25zb2xlLmxvZygnPj4+Pj4gc2V0IHRpbWVvdXQnKTtcbiAgICAgIHZhciBpZnJhbWUgPSB0aGlzLmNyZWF0ZVNjcmVlbkZyYW1lKCk7XG4gICAgICBpZnJhbWUuY2xhc3NMaXN0LmFkZCgnZm94bm9iLWNvbmZpZycpO1xuICAgICAgaWZyYW1lLnN0eWxlLnpJbmRleCA9ICc2NTUzNSc7XG4gICAgICBpZnJhbWUuc3JjID0gdXJsO1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3N0YXR1c2JhcicpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICB0aGlzLl9jb25maWdGcmFtZSA9IGlmcmFtZTtcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4+PiBhcHBlbmQnKTtcbiAgICAgIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5hcHBlbmRDaGlsZChpZnJhbWUpO1xuICAgICAgY29uc29sZS5sb2coJz4+Pj4+PiBhZGQgZXZlbnQgbGlzdGVuZXIgbG9jYXRpb24gbm93Jyk7XG4gICAgICBpZnJhbWUuYWRkRXZlbnRMaXN0ZW5lcignbW96YnJvd3NlcmxvY2F0aW9uY2hhbmdlJywgdGhpcyk7XG4gICAgICBjb25zb2xlLmxvZygnPj4+Pj4gZG9uZScpO1xuICAgIH0pO1xuICB9KTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLmNyZWF0ZVNjcmVlbkZyYW1lID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgaWZyYW1lLmlkID0gJ2ZveG5vYi1hY3RpdmF0ZWQtc2NyZWVuJztcbiAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnbW96YnJvd3NlcicsICd0cnVlJyk7XG4gIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ3JlbW90ZScsICd0cnVlJyk7XG4gIGlmcmFtZS5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gIHJldHVybiBpZnJhbWU7XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5wcm9tcHROb0Nvbm5lY3Rpb24gPSBmdW5jdGlvbih1cmwpIHtcbiAgY29uc29sZS5sb2coJz4+Pj4+PiBubyBjb25uZWN0aW9uJyk7XG4gIHZhciBjb3ZlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBjb3Zlci50ZXh0Q29udGVudCA9ICdObyBDb25uZWN0aW9uISBbeF0nO1xuICBjb3Zlci5pZCA9ICdmb3hub2Itd2FpdGluZy1jb3Zlcic7XG4gIGNvdmVyLnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgY292ZXIuc3R5bGUuekluZGV4ID0gJzY1NTM4JztcbiAgY292ZXIuc3R5bGUuanVzdGlmeUNvbnRlbnQgPSAnY2VudGVyJztcbiAgY292ZXIuc3R5bGUuYWxpZ25JdGVtcyA9ICdjZW50ZXInO1xuICBjb3Zlci5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICBjb3Zlci5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgY292ZXIuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xuICBjb3Zlci5zdHlsZS5iYWNrZ3JvdW5kID0gJ3doZWF0JztcbiAgY292ZXIuc3R5bGUuY29sb3IgPSAnIzMzMzMzMyc7XG4gIGNvdmVyLnN0eWxlLmZvbnRTaXplID0gJzJyZW0nO1xuICB0aGlzLl9lcnJvckNvdmVyID0gY292ZXI7XG4gIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5hcHBlbmRDaGlsZChjb3Zlcik7XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5sb2FkRGVmYXVsdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgeyB1cmwsIG1hbmlmZXN0IH0gPSB0aGlzLl9zdG9yZS5mZXRjaERlZmF1bHQoJ2ZveG5vYi1kZWZhdWx0Jyk7XG4gIHZhciBpZnJhbWUgPSB0aGlzLmNyZWF0ZVNjcmVlbkZyYW1lKCk7XG4gIGNvbnNvbGUubG9nKCc+Pj4+IHdhbnQgdG8gbG9hZCBkZWZhdWx0OiAnLCB1cmwsIG1hbmlmZXN0KTtcbiAgLy8gUmVtb3RlLiBOZWVkIGludGVybmV0LlxuICBpZiAoIW1hbmlmZXN0KSB7XG4gICAgdGhpcy5hc3NlcnRDb25uZWN0aW9uKCkudGhlbigoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnPj4+IG5vIG1hbmlmZXN0Jyk7XG4gICAgICBpZnJhbWUuc3R5bGUuekluZGV4ID0gJzEnO1xuICAgICAgaWZyYW1lLnN0eWxlLmJhY2tncm91bmQgPSAnYmxhY2snO1xuICAgICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnc3JjJywgdXJsKTtcbiAgICAgIHRoaXMuX2NvbnRlbnRGcmFtZSA9IGlmcmFtZTtcbiAgICAgIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5hcHBlbmRDaGlsZChpZnJhbWUpO1xuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIHRoaXMucHJvbXB0Tm9Db25uZWN0aW9uKHVybCk7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJz4+PiB3aXRoIG1hbmlmZXN0Jyk7XG4gICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnc3JjJywgdXJsKTtcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdtb3phcHAnLCBtYW5pZmVzdCk7XG4gICAgaWZyYW1lLnN0eWxlLmJhY2tncm91bmQgPSAnYmxhY2snO1xuICAgIGlmcmFtZS5zdHlsZS56SW5kZXggPSAnMSc7XG4gICAgdGhpcy5fY29udGVudEZyYW1lID0gaWZyYW1lO1xuICAgIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5hcHBlbmRDaGlsZChpZnJhbWUpO1xuICB9XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5mcm9tTmFtZVRvSW5zdGFsbGVkID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gbmF2aWdhdG9yLm1vekFwcHMubWdtdC5nZXRBbGwoKVxuICAgIC50aGVuKChhcHBzKSA9PiB7XG4gICAgICByZXR1cm4gYXBwcy5maWx0ZXIoKGFwcCkgPT4ge1xuICAgICAgICBpZiAoYXBwLm1hbmlmZXN0KSB7XG4gICAgICAgICAgcmV0dXJuIChuYW1lID09PSBhcHAubWFuaWZlc3QubmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KVswXTtcbiAgICB9KTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLmFzc2VydENvbm5lY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGxvY2sgPSBuYXZpZ2F0b3IubW96U2V0dGluZ3MuY3JlYXRlTG9jaygpO1xuICB2YXIgd2lmaSA9IGxvY2suZ2V0KCd3aWZpLmVuYWJsZWQnKS50aGVuKChyKSA9PiB7IHJldHVybiByWyd3aWZpLmVuYWJsZWQnXTt9KTtcbiAgdmFyIHJpbGRhdGEgPSBsb2NrLmdldCgncmlsLmRhdGEuZW5hYmxlZCcpLnRoZW4oKHIpID0+IHsgcmV0dXJuIHJbJ3JpbC5kYXRhLmVuYWJsZWQnXTt9KTtcbiAgcmV0dXJuIFByb21pc2UuYWxsKFt3aWZpLCByaWxkYXRhXSkudGhlbigocnMpID0+IHtcbiAgICBpZiAocnNbMF0gfHwgcnNbMV0pIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdObyBjb25uZWN0aW9uOiAnLCByc1swXSwgcnNbMV0pO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBjb25uZWN0aW9uOiAnKTtcbiAgICB9XG4gIH0pO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUubG9hZER1bW15U2NyZWVuTGVmdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gIHZhciBvbGQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWN0aXZhdGVkLWxvY2tzY3JlZW4tY29udGVudCcpO1xuICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIucmVtb3ZlQ2hpbGQob2xkKTtcbiAgaWZyYW1lLmlkID0gJ2FjdGl2YXRlZC1sb2Nrc2NyZWVuLWNvbnRlbnQnO1xuICBpZnJhbWUuc2V0QXR0cmlidXRlKCdtb3picm93c2VyJywgJ3RydWUnKTtcbiAgaWZyYW1lLnNldEF0dHJpYnV0ZSgncmVtb3RlJywgJ3RydWUnKTtcbiAgaWZyYW1lLnNyYyA9ICdhcHA6Ly9jYWxlbmRhci5nYWlhbW9iaWxlLm9yZy9pbmRleC5odG1sJztcbiAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLmFwcGVuZENoaWxkKGlmcmFtZSk7XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5sb2FkRHVtbXlTY3JlZW5SaWdodCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gIHZhciBvbGQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWN0aXZhdGVkLWxvY2tzY3JlZW4tY29udGVudCcpO1xuICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIucmVtb3ZlQ2hpbGQob2xkKTtcbiAgaWZyYW1lLmlkID0gJ2FjdGl2YXRlZC1sb2Nrc2NyZWVuLWNvbnRlbnQnO1xuICBpZnJhbWUuc2V0QXR0cmlidXRlKCdtb3picm93c2VyJywgJ3RydWUnKTtcbiAgaWZyYW1lLnNldEF0dHJpYnV0ZSgncmVtb3RlJywgJ3RydWUnKTtcbiAgaWZyYW1lLnNyYyA9ICdhcHA6Ly9jbG9jay5nYWlhbW9iaWxlLm9yZy9pbmRleC5odG1sJztcbiAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLmFwcGVuZENoaWxkKGlmcmFtZSk7XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS53YWl0TG9ja1NjcmVlbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmVzb2x2ZTtcbiAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZSgoX3IsIF9qKSA9PiB7XG4gICAgcmVzb2x2ZSA9IF9yO1xuICB9KTtcbiAgdmFyIHNvbHZlSXQgPSBmdW5jdGlvbiBzb2x2ZUl0KCkge1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdsb2Nrc2NyZWVuLWFwcG9wZW5lZCcsIHNvbHZlSXQpO1xuICAgIHJlc29sdmUoKTtcbiAgfTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvY2tzY3JlZW4tYXBwb3BlbmVkJywgc29sdmVJdCk7XG4gIHJldHVybiBwcm9taXNlO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUuc2V0dXBFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgLy9uYXZpZ2F0b3IubW96QXBwcy5tZ210LmFkZEV2ZW50TGlzdGVuZXIoJ2VuYWJsZWRzdGF0ZWNoYW5nZScsIHRoaXMpO1xuICAvL25hdmlnYXRvci5tb3pBcHBzLm1nbXQuYWRkRXZlbnRMaXN0ZW5lcigndW5pbnN0YWxsJywgdGhpcyk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMpO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUuc2V0dXBFbGVtZW50cyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmVsZW1lbnRzLndpbmRvdyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hcHBXaW5kb3cubG9ja1NjcmVlbldpbmRvdycpO1xuICBpZiAoIXRoaXMuZWxlbWVudHMud2luZG93IHx8ICF0aGlzLmVsZW1lbnRzLndpbmRvdy5jbGFzc0xpc3QuY29udGFpbnMoJ2FjdGl2ZScpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdObyBMb2NrU2NyZWVuIHdoaWxlIHNldHRpbmcgdXAuJyk7XG4gIH1cbiAgdGhpcy5lbGVtZW50cy5mcmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsb2Nrc2NyZWVuLWZyYW1lJyk7XG4gIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lciA9IHRoaXMuZWxlbWVudHMuZnJhbWUucGFyZW50RWxlbWVudDtcbiAgdGhpcy5lbGVtZW50cy5iYWNrZ3JvdW5kID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xvY2tzY3JlZW4tYmFja2dyb3VuZCcpO1xuXG4gIHRoaXMub3JpZ2luYWxzLmJhY2tncm91bmRJbWFnZSA9IHRoaXMuZWxlbWVudHMuYmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2U7XG4gIHRoaXMub3JpZ2luYWxzLmJhY2tncm91bmRDb2xvciA9IHRoaXMuZWxlbWVudHMuYmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3I7XG4gIHRoaXMub3JpZ2luYWxzLmJyb3dzZXJDb250YWluZXJCYWNrZ3JvdW5kID0gdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLnN0eWxlLmJhY2tncm91bmQ7XG5cbiAgdGhpcy5lbGVtZW50cy5iYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmQgPSAnbm9uZSc7XG4gIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5iYWNrZ3JvdW5kID0gJ25vbmUnO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUub25FbmFibGUgPSBmdW5jdGlvbigpIHtcblxufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUub25EaXNhYmxlID0gZnVuY3Rpb24oKSB7XG5cbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLm9uTGVmdExvY2tTY3JlZW4gPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJz4+Pj4gb24gbGVmdCBsb2Nrc2NyZWVuJyk7XG4gIHRoaXMubG9hZER1bW15U2NyZWVuTGVmdCgpO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUub25SaWdodExvY2tTY3JlZW4gPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJz4+Pj4gb24gcmlnaHQgbG9ja3NjcmVlbicpO1xuICB0aGlzLmxvYWREdW1teVNjcmVlblJpZ2h0KCk7XG59O1xuXG4vKlxuQ29udHJvbGxlci5wcm90b3R5cGUuaGFuZGxlRXZlbnQgPSBmdW5jdGlvbihlKSB7XG4gIC8vIGRlYnVnIGF0IGFpclxuICAvLyB2YXIgTUFOSUZFU1RfVVJMID0gJ2FwcDovL2Q4ZGM2MGMwLWE3YjAtMDE0Yi04NjU5LWFlNTdjYTdmNWZjYS9tYW5pZmVzdC53ZWJhcHAnO1xuICAvLyBvbmxpbmUgdmVyc2lvblxuICB2YXIgTUFOSUZFU1RfVVJMID0gJ2h0dHBzOi8vZ3JlZy13ZW5nLmdpdGh1Yi5pby9yZXBsYWNhYmxlLWxvY2tzY3JlZW5zL21hbmlmZXN0LndlYmFwcCc7XG4gIGlmIChlLmFwcGxpY2F0aW9uLm1hbmlmZXN0VVJMICE9PSBNQU5JRkVTVF9VUkwpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBzd2l0Y2goZS50eXBlKSB7XG4gICAgY2FzZSAnZW5hYmxlZHN0YXRlY2hhbmdlJzpcbiAgICAgIGlmIChlLmFwcGxpY2F0aW9uLmVuYWJsZWQpIHtcbiAgICAgICAgdGhpcy5uZXh0KHRoaXMub25FbmFibGUuYmluZCh0aGlzKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm5leHQodGhpcy5vbkRpc2FibGUuYmluZCh0aGlzKSk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICd1bmluc3RhbGwnOlxuICAgICAgdGhpcy5uZXh0KHRoaXMub25Vbmluc3RhbGwuYmluZCh0aGlzKSk7XG4gICAgICBicmVhaztcbiAgfVxufTtcbiovXG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLm9uVW5pbnN0YWxsID0gZnVuY3Rpb24oKSB7XG4gIG5hdmlnYXRvci5tb3pBcHBzLm1nbXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZW5hYmxlZHN0YXRlY2hhbmdlJywgdGhpcyk7XG4gIG5hdmlnYXRvci5tb3pBcHBzLm1nbXQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndW5pbnN0YWxsJywgdGhpcyk7XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvQ29udHJvbGxlci5qc1xuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuLyogZ2xvYmFsIEhhbW1lciAqL1xuXG5leHBvcnQgZnVuY3Rpb24gR2VzdHVyZUNvbnRyb2xsZXIoKSB7fVxuR2VzdHVyZUNvbnRyb2xsZXIucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucXVldWUgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgdGhpcy5zZXR1cENvdmVyKCk7XG4gIHZhciBoYW1tZXIgICAgPSBuZXcgSGFtbWVyLk1hbmFnZXIodGhpcy5jb3Zlcik7XG4gIHZhciBzd2lwZSAgICAgPSBuZXcgSGFtbWVyLlN3aXBlKCk7XG4gIGhhbW1lci5hZGQoc3dpcGUpO1xuICBoYW1tZXIub24oJ3N3aXBlbGVmdCcsICgpID0+IHtcbiAgICBjb25zb2xlLmxvZygnPDw8PDw8IGxlZnQnKTtcbiAgICB0aGlzLm5leHQodGhpcy5sZWZ0QmluZGVycykubmV4dCgoKSA9PiB7Y29uc29sZS5sb2coJzw8PDw8PCBhZnRlciBsZWZ0Jyk7fSk7XG4gIH0pO1xuICBoYW1tZXIub24oJ3N3aXBlcmlnaHQnLCAoKSA9PiB7XG4gICAgY29uc29sZS5sb2coJz4+Pj4+IHJpZ2h0Jyk7XG4gICAgdGhpcy5uZXh0KHRoaXMucmlnaHRCaW5kZXJzKS5uZXh0KCgpID0+IHtjb25zb2xlLmxvZygnPj4+Pj4+IGFmdGVyIHJpZ2h0Jyk7fSk7XG4gIH0pO1xuICBoYW1tZXIub24oJ3N3aXBldXAnLCAoKSA9PiB7XG4gICAgY29uc29sZS5sb2coJ15eXl5eXl4gdXAnLCB0aGlzLnVwQmluZGVycy5sZW5ndGgpO1xuICAgIHRoaXMubmV4dCh0aGlzLnVwQmluZGVycykubmV4dCgoKSA9PiB7Y29uc29sZS5sb2coJ15eXl5eXl5eIGFmdGVyIHVwJyk7fSk7XG4gIH0pO1xuICB0aGlzLmxlZnRCaW5kZXJzID0gW107XG4gIHRoaXMucmlnaHRCaW5kZXJzID0gW107XG4gIHRoaXMudXBCaW5kZXJzID0gW107XG4gIHJldHVybiB0aGlzO1xufTtcblxuR2VzdHVyZUNvbnRyb2xsZXIucHJvdG90eXBlLnNldHVwQ292ZXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jb3ZlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB0aGlzLmNvdmVyLmlkID0gJ2ZveG5vYi1jb3Zlcic7XG4gIC8vIGRlYnVnIGNvbG9yXG4gIC8vdGhpcy5jb3Zlci5zdHlsZS5iYWNrZ3JvdW5kID0gJ3JnYmEoMCwgMTAwLCAwLCAwLjEpJztcbiAgdGhpcy5jb3Zlci5zdHlsZS53aWR0aCA9ICAnMTAwJSc7XG4gIHRoaXMuY292ZXIuc3R5bGUuaGVpZ2h0ID0gJzgwJSc7XG4gIHRoaXMuY292ZXIuc3R5bGUucG9zaXRpb24gPSAnZml4ZWQnO1xuICB0aGlzLmNvdmVyLnN0eWxlLnRvcCA9ICc0MHB4JztcbiAgdGhpcy5jb3Zlci5zdHlsZS56SW5kZXggPSAnOCc7XG59O1xuXG5HZXN0dXJlQ29udHJvbGxlci5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uKHN0ZXBzKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShzdGVwcykpIHtcbiAgICBzdGVwcyA9IFtzdGVwc107XG4gIH1cbiAgdmFyIHN0ZXBQcm9taXNlcyA9IHN0ZXBzLm1hcCgoc3RlcCkgPT4ge1xuICAgIHJldHVybiBzdGVwKCk7XG4gIH0pO1xuICB0aGlzLnF1ZXVlID0gdGhpcy5xdWV1ZS50aGVuKCgpID0+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoc3RlcFByb21pc2VzKTtcbiAgfSkuY2F0Y2goY29uc29sZS5lcnJvci5iaW5kKGNvbnNvbGUpKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5HZXN0dXJlQ29udHJvbGxlci5wcm90b3R5cGUuYmluZE9uTGVmdCA9IGZ1bmN0aW9uKGNiKSB7XG4gIHRoaXMubGVmdEJpbmRlcnMucHVzaChjYik7XG59O1xuXG5HZXN0dXJlQ29udHJvbGxlci5wcm90b3R5cGUuYmluZE9uUmlnaHQgPSBmdW5jdGlvbihjYikge1xuICB0aGlzLnJpZ2h0QmluZGVycy5wdXNoKGNiKTtcbn07XG5cbkdlc3R1cmVDb250cm9sbGVyLnByb3RvdHlwZS5iaW5kT25VcCA9IGZ1bmN0aW9uKGNiKSB7XG4gIHRoaXMudXBCaW5kZXJzLnB1c2goY2IpO1xufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL0dlc3R1cmVDb250cm9sbGVyLmpzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnQgZnVuY3Rpb24gU3RvcmUoKSB7fVxuU3RvcmUucHJvdG90eXBlLmZldGNoRGVmYXVsdCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnZm94bm9iLWRlZmF1bHQnKSk7XG59O1xuXG5TdG9yZS5wcm90b3R5cGUuc3VibWl0RGVmYXVsdCA9IGZ1bmN0aW9uKHVybCwgbG9jYWwsIHBheWxvYWQpIHtcbiAgaWYgKGxvY2FsKSB7XG4gICAgdXJsID0gcGF5bG9hZC5vcmlnaW47XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2ZveG5vYi1kZWZhdWx0JyxcbiAgICAgIEpTT04uc3RyaW5naWZ5KHsgJ3VybCc6IHBheWxvYWQub3JpZ2luICsgcGF5bG9hZC5tYW5pZmVzdC5sYXVuY2hfcGF0aCArICcjc2VjdXJlJyxcbiAgICAgICAgICAgICAgICAgICAgICdtYW5pZmVzdCc6IHBheWxvYWQubWFuaWZlc3RVUkwgfSkpO1xuICAgIGNvbnNvbGUubG9nKCc+Pj4+Pj4+IHN1Ym1pdGxvY2FsZGVmYXVsdDogJywgbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2ZveG5vYi1kZWZhdWx0JykpO1xuICB9IGVsc2Uge1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdmb3hub2ItZGVmYXVsdCcsXG4gICAgICBKU09OLnN0cmluZ2lmeSh7ICd1cmwnOiB1cmwsICdtYW5pZmVzdCc6IG51bGx9KSk7XG4gICAgY29uc29sZS5sb2coJz4+Pj4+Pj4gc3VibWl0Tk9URGVmYXVsdDogJywgbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2ZveG5vYi1kZWZhdWx0JykpO1xuICB9XG59O1xuXG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9TdG9yZS5qc1xuICoqLyJdLCJzb3VyY2VSb290IjoiIn0=