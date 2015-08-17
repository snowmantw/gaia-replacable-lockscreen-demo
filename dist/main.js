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
	  this._retryTime = 0;
	  this._retryMax = 15;
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
	  } else if ('reset' === command) {
	    this.onReset();
	  }
	};
	
	Controller.prototype.removeConfigFrame = function () {
	  if (null !== this._configFrame) {
	    this.elements.browserContainer.removeChild(this._configFrame);
	    this._configFrame = null;
	  }
	};
	
	Controller.prototype.removeContentFrame = function () {
	  if (null !== this._contentFrame) {
	    this.elements.browserContainer.removeChild(this._contentFrame);
	    this._contentFrame = null;
	  }
	};
	
	Controller.prototype.resetStatusbar = function () {
	  document.querySelector('#statusbar').style.display = 'block';
	};
	
	Controller.prototype.onReset = function () {
	  console.log('>>>>>> reset start');
	  this.removeContentFrame();
	  this.removeConfigFrame();
	  this.resetStatusbar();
	  console.log('>>>>>> reset stopped');
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
	
	  console.log('>>>>>>> try delay invoke');
	  this.invokeInstalled(name).then(function () {
	    console.log('>>>>>> progress delay invoke done: name: ', name);
	    _this3._retryTime = 0;
	  })['catch'](function (err) {
	    if (_this3._retryTime > _this3._retryMax) {
	      throw new Error('Can\'t invoke the app ' + name + ' after ' + _this3._retryMax + ' times');
	    }
	    _this3._retryTime += 1;
	    setTimeout(function () {
	      // XXX: can't invoke an app just after install it (~3 or 5 seconds).
	      // I suspect it's a bug but I don't have better way to do that.
	      console.error('Retry due to: ', err);
	      _this3.tryDelayInvoke(name);
	    }, 200);
	  });
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
	      throw new Error('No such content: ', name);
	    }
	  })['catch'](function (err) {
	    console.error(err);
	    throw err;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMGNjYWE4MTJjNWY1Mzc0YzczNGMiLCJ3ZWJwYWNrOi8vLy4vc3JjL1N0YXJ0dXAuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL0NvbnRyb2xsZXIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL0dlc3R1cmVDb250cm9sbGVyLmpzIiwid2VicGFjazovLy8uL3NyYy9TdG9yZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7OztBQ3RDQSxhQUFZLENBQUM7OzRDQUNjLENBQW1COztBQUM5QyxFQUFDLFlBQVk7QUFDWCxXQUFRLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLEVBQUUsU0FBUyxnQkFBZ0IsR0FBRztBQUN4RSxZQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDakMsU0FBSSxNQUFNLEdBQUUscUJBSlAsVUFBVSxFQUlhLENBQUM7QUFDN0IsV0FBTSxDQUFDLEtBQUssRUFBRSxDQUFDOzs7Ozs7Ozs7SUFTaEIsQ0FBQyxDQUFDO0VBQ0osR0FBRyxDOzs7Ozs7QUNoQkosYUFBWSxDQUFDOzs7O1NBR0csVUFBVSxHQUFWLFVBQVU7O21EQUZRLENBQTBCOzt1Q0FDdEMsQ0FBYzs7QUFDN0IsVUFBUyxVQUFVLEdBQUcsRUFBRTs7QUFDL0IsV0FBVSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsWUFBVzs7O0FBQ3RDLE9BQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO0FBQ3pCLE9BQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO0FBQ3BCLE9BQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO0FB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LFVBQVMsS0FBSyxHQUFHLEVBQUU7O0FBQzFCLE1BQUssQ0FBQyxTQUFTLENBQUMsWUFBWSxHQUFHLFlBQVc7QUFDeEMsVUFBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO0VBQzNELENBQUM7O0FBRUYsTUFBSyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEdBQUcsVUFBUyxHQUFHLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRTtBQUM1RCxPQUFJLEtBQUssRUFBRTtBQUNULFFBQUcsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO0FBQ3JCLGlCQUFZLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUNuQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEdBQUcsU0FBUztBQUNsRSxpQkFBVSxFQUFFLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDckQsWUFBTyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsRUFBRSxZQUFZLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztJQUNyRixNQUFNO0FBQ0wsaUJBQVksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQ25DLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkQsWUFBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsRUFBRSxZQUFZLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztJQUNuRjtFQUNGLEMiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay9ib290c3RyYXAgMGNjYWE4MTJjNWY1Mzc0YzczNGNcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5pbXBvcnQgeyBDb250cm9sbGVyIH0gZnJvbSAnc3JjL0NvbnRyb2xsZXIuanMnO1xuKGZ1bmN0aW9uICgpIHtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncmVhZHlzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uIHJlYWR5U3RhdGVDaGFuZ2UoKSB7XG4gICAgY29uc29sZS5sb2coJz4+Pj4+Pj4+IGluIGFkZG9uJyk7XG4gICAgdmFyIGZveG5vYj0gbmV3IENvbnRyb2xsZXIoKTtcbiAgICBmb3hub2Iuc3RhcnQoKTtcbiAgICAvKlxuICAgIGNvbnNvbGUubG9nKCc+Pj4+Pj4+PiBpbiBhZGRvbicpO1xuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnaW50ZXJhY3RpdmUnKSB7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdyZWFkeXN0YXRlY2hhbmdlJywgcmVhZHlTdGF0ZUNoYW5nZSk7XG4gICAgICB2YXIgZm94bm9iPSBuZXcgQ29udHJvbGxlcigpO1xuICAgICAgZm94bm9iLnN0YXJ0KCk7XG4gICAgfVxuICAgICovXG4gIH0pO1xufSkoKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL1N0YXJ0dXAuanNcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5pbXBvcnQgeyBHZXN0dXJlQ29udHJvbGxlciB9IGZyb20gJ3NyYy9HZXN0dXJlQ29udHJvbGxlci5qcyc7XG5pbXBvcnQgeyBTdG9yZSB9IGZyb20gJ3NyYy9TdG9yZS5qcyc7XG5leHBvcnQgZnVuY3Rpb24gQ29udHJvbGxlcigpIHt9XG5Db250cm9sbGVyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLlNDUkVFTl9USU1FT1VUID0gMzA7XG4gIHRoaXMuX3JldHJ5VGltZSA9IDA7XG4gIHRoaXMuX3JldHJ5TWF4ID0gMTU7XG4gIHRoaXMuX2Vycm9yQ292ZXIgPSBudWxsO1xuICB0aGlzLl93YWl0aW5nVGltZXIgPSBudWxsO1xuICB0aGlzLl9zdG9yZSA9IG5ldyBTdG9yZSgpO1xuICB0aGlzLl9jb25maWdGcmFtZSA9IG51bGw7XG4gIHRoaXMuX3dhaXRpbmdDb3ZlciA9IG51bGw7XG4gIHRoaXMuX2NvbnRlbnRGcmFtZSA9IG51bGw7XG4gIHRoaXMuX2FwcEluc3RhbGxaSW5kZXggPSAxMDI0O1xuICBjb25zb2xlLmxvZygnPj4+PiB0cnkgdG8gbGF1bmNoIGFkZG9uJyk7XG4gIC8vIFRPRE86IDEuIGlmIHdlIGhhdmUgc2V0dGluZ3MgdG8ga25vdyBob3cgbWFueSBMU1cgY291bGQgYmUgaW5qZWN0ZWQsXG4gIC8vICAgICAgICAgIHJlYWQgaXQgaGVyZS5cbiAgLy8gICAgICAgMi4gc29tZSBkdW1teSBmdW5jdGlvbiBuZWVkIHRvIGJlIGZpbGxlZCBsYXRlci5cbiAgdGhpcy5xdWV1ZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMuZWxlbWVudHMgPSB7fTtcbiAgICAgIHRoaXMub3JpZ2luYWxzID0ge307XG4gICAgICAvLyBUT0RPOiBzaG91bGQgcmVhZCBjb25maWcgaGVyZVxuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0pXG4gICAgLnRoZW4odGhpcy5zZXR1cEV2ZW50cy5iaW5kKHRoaXMpKS50aGVuKHRoaXMubGFiZWwuYmluZCh0aGlzLCAnPj4+IGxhdW5jaGluZycpKVxuICAgIC50aGVuKHRoaXMud2FpdExvY2tTY3JlZW4uYmluZCh0aGlzKSkudGhlbih0aGlzLmxhYmVsLmJpbmQodGhpcywgJz4+PiB3YWl0IGxvY2tzY3JlZW4gZG9uZScpKVxuICAgIC50aGVuKHRoaXMuc2V0dXBFbGVtZW50cy5iaW5kKHRoaXMpKS50aGVuKHRoaXMubGFiZWwuYmluZCh0aGlzLCAnPj4+IHNldCBlbGVtZW50cyBkb25lJykpXG4gICAgLnRoZW4odGhpcy5zZXR1cEdlc3R1cmUuYmluZCh0aGlzKSkudGhlbih0aGlzLmxhYmVsLmJpbmQodGhpcywgJz4+PiBzZXQgZ2VzdHVyZSBkb25lJykpXG4vLyAgICAudGhlbih0aGlzLmxvYWREZWZhdWx0LmJpbmQodGhpcykpLnRoZW4odGhpcy5sYWJlbC5iaW5kKHRoaXMsICc+Pj4gbG9hZCBkZWZhdWx0IG9uZScpKVxuICAgIC5jYXRjaCh0aGlzLm9uTWFpblByb21pc2VFcnJvci5iaW5kKHRoaXMpKTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLmxhYmVsID0gZnVuY3Rpb24obGIpIHtcbiAgY29uc29sZS5sb2cobGIpO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUub25NYWluUHJvbWlzZUVycm9yID0gZnVuY3Rpb24oZXJyKSB7XG4gIGNvbnNvbGUuZXJyb3IoJz4+PiBDb250cm9sbGVyIEVycm9yOiAnLCBlcnIpO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUuc2V0dXBHZXN0dXJlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2dlc3R1cmVDb250cm9sbGVyID0gbmV3IEdlc3R1cmVDb250cm9sbGVyKCk7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdGhpcy5fZ2VzdHVyZUNvbnRyb2xsZXIuc3RhcnQoKVxuICAgIC5uZXh0KCgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4+IGJpbmQgZ2VzdHVyZSBpbiBDb250cm9sbGVyJyk7XG4gICAgICB0aGlzLl9nZXN0dXJlQ29udHJvbGxlci5iaW5kT25MZWZ0KHRoaXMub25MZWZ0TG9ja1NjcmVlbi5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuX2dlc3R1cmVDb250cm9sbGVyLmJpbmRPblJpZ2h0KHRoaXMub25SaWdodExvY2tTY3JlZW4uYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLl9nZXN0dXJlQ29udHJvbGxlci5iaW5kT25VcCh0aGlzLm9uT3BlbkNvbmZpZy5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLl9nZXN0dXJlQ29udHJvbGxlci5jb3Zlcik7XG4gICAgfSlcbiAgICAubmV4dCgoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnPj4+PiBlbmRpbmcgZ2VzdHVyZSBzZXR1cCBpbiBDb250cm9sbGVyJyk7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUuaGFuZGxlRXZlbnQgPSBmdW5jdGlvbihldnQpIHtcbiAgc3dpdGNoIChldnQudHlwZSkge1xuICAgIGNhc2UgJ21vemJyb3dzZXJsb2NhdGlvbmNoYW5nZSc6XG4gICAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAvLyBUT0RPOiBjYW4gcHJldmlldyB0aGUgVUkgYmVmb3JlIGFwcGx5IHRoYXQ6XG4gICAgICAvLyBhZGQgYSBmaWVsZCBpbiB0aGUgaGFzaC5cbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4+Pj4+IGxvY2F0aW9uY2hhbmdlZCcsIGV2dCk7XG4gICAgICB2YXIgdXJsID0gZXZ0LmRldGFpbDtcbiAgICAgIHZhciBoYXNoID0gdXJsLnJlcGxhY2UoL14uKiMvLCAnJyk7XG4gICAgICB2YXIgc2NyZWVuTmFtZVBhcnNlZCA9IGhhc2gubWF0Y2goL3NjcmVlbm5hbWUtKC4qKS8pO1xuICAgICAgdmFyIGNvbW1hbmRQYXJzZWQgPSBoYXNoLm1hdGNoKC9jb21tYW5kLSguKikvKTtcbiAgICAgIHZhciBpbnN0YWxsUGFyc2VkID0gaGFzaC5tYXRjaCgvaW5zdGFsbC0oLiopLyk7XG4gICAgICBjb25zb2xlLmxvZygnPj4+Pj4+IHVybDonLCB1cmwsIGhhc2gsIHNjcmVlbk5hbWVQYXJzZWQsIGNvbW1hbmRQYXJzZWQpO1xuICAgICAgaWYgKG51bGwgIT09IHNjcmVlbk5hbWVQYXJzZWQpIHtcbiAgICAgICAgdGhpcy5uZXh0KHRoaXMub25TY3JlZW5DaGFuZ2UuYmluZCh0aGlzLCBzY3JlZW5OYW1lUGFyc2VkWzFdKSk7XG4gICAgICB9IGVsc2UgaWYobnVsbCAhPT0gY29tbWFuZFBhcnNlZCkge1xuICAgICAgICB0aGlzLm5leHQodGhpcy5vbkNvbmZpZ0NvbW1hbmQuYmluZCh0aGlzLCBjb21tYW5kUGFyc2VkWzFdKSk7XG4gICAgICB9IGVsc2UgaWYgKG51bGwgIT09IGluc3RhbGxQYXJzZWQpIHtcbiAgICAgICAgdGhpcy5uZXh0KHRoaXMub25JbnN0YWxsLmJpbmQodGhpcywgaW5zdGFsbFBhcnNlZFsxXSkpO1xuICAgICAgfSBlbHNlIHsgIC8vIGxvYWRlZC5cbiAgICAgICAgdGhpcy5yZW1vdmVXYWl0aW5nQ292ZXIoKTtcbiAgICAgICAgY29uc29sZS5sb2coJz4+Pj4+IHRvIHJlbW92ZVdhaXRpbmcgYW5kIG9wZW4gdGhlIGNvbmZpZycpO1xuICAgICAgICB0aGlzLm5leHQodGhpcy5vbkNvbmZpZ09wZW5lZC5iaW5kKHRoaXMpKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NsaWNrJzpcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4+Pj4gY2xpY2sgZXZlbnQ6ICcsIHRoaXMuX3dhaXRpbmdDb3ZlciwgdGhpcy5fZXJyb3JDb3Zlcik7XG4gICAgICBpZiAodGhpcy5fd2FpdGluZ0NvdmVyICYmIGV2dC50YXJnZXQgPT09IHRoaXMuX3dhaXRpbmdDb3Zlcikge1xuICAgICAgICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5fd2FpdGluZ0NvdmVyKTtcbiAgICAgICAgdGhpcy5fd2FpdGluZ0NvdmVyID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMuX2NvbmZpZ0ZyYW1lKSB7XG4gICAgICAgICAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuX2NvbmZpZ0ZyYW1lKTtcbiAgICAgICAgICB0aGlzLl9jb25maWdGcmFtZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX2Vycm9yQ292ZXIgJiYgZXZ0LnRhcmdldCA9PT0gdGhpcy5fZXJyb3JDb3Zlcikge1xuICAgICAgICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5fZXJyb3JDb3Zlcik7XG4gICAgICAgIHRoaXMuX2Vycm9yQ292ZXIgPSBudWxsO1xuICAgICAgfVxuICB9XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5vbkNvbmZpZ0NvbW1hbmQgPSBmdW5jdGlvbihjb21tYW5kKSB7XG4gIGlmICgnY2FuY2VsJyA9PT0gY29tbWFuZCkge1xuICAgIGlmIChudWxsICE9PSB0aGlzLl9jb25maWdGcmFtZSkge1xuICAgICAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuX2NvbmZpZ0ZyYW1lKTtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzdGF0dXNiYXInKS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgIHRoaXMuX2NvbmZpZ0ZyYW1lID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coJz4+Pj4+Pj4gY2FudCByZW1vdmUgaXQnKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoJ3Jlc2V0JyA9PT0gY29tbWFuZCkge1xuICAgIHRoaXMub25SZXNldCgpO1xuICB9XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5yZW1vdmVDb25maWdGcmFtZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAobnVsbCAhPT0gdGhpcy5fY29uZmlnRnJhbWUpIHtcbiAgICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5fY29uZmlnRnJhbWUpO1xuICAgIHRoaXMuX2NvbmZpZ0ZyYW1lID0gbnVsbDtcbiAgfVxufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUucmVtb3ZlQ29udGVudEZyYW1lID0gZnVuY3Rpb24oKSB7XG4gIGlmIChudWxsICE9PSB0aGlzLl9jb250ZW50RnJhbWUpIHtcbiAgICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5fY29udGVudEZyYW1lKTtcbiAgICB0aGlzLl9jb250ZW50RnJhbWUgPSBudWxsO1xuICB9XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5yZXNldFN0YXR1c2JhciA9IGZ1bmN0aW9uKCkge1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc3RhdHVzYmFyJykuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5vblJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCc+Pj4+Pj4gcmVzZXQgc3RhcnQnKTtcbiAgdGhpcy5yZW1vdmVDb250ZW50RnJhbWUoKTtcbiAgdGhpcy5yZW1vdmVDb25maWdGcmFtZSgpO1xuICB0aGlzLnJlc2V0U3RhdHVzYmFyKCk7XG4gIGNvbnNvbGUubG9nKCc+Pj4+Pj4gcmVzZXQgc3RvcHBlZCcpO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUub25JbnN0YWxsID0gZnVuY3Rpb24oc3RycHJvZ3Jlc3MpIHtcbiAgdmFyIHByb2dyZXNzID0gSlNPTi5wYXJzZShkZWNvZGVVUklDb21wb25lbnQoc3RycHJvZ3Jlc3MpKTtcbiAgdmFyIGRpYWxvZztcbiAgY29uc29sZS5sb2coJz4+Pj4+Pj4+IG9uSW5zdGFsbDogJywgcHJvZ3Jlc3MpO1xuICBpZiAoJ3N0YXJ0JyA9PT0gcHJvZ3Jlc3Muc3RhZ2UpIHtcbiAgICBkaWFsb2cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYXBwLWluc3RhbGwtZGlhbG9nJyk7XG4gICAgaWYgKCFkaWFsb2cpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gaW5zdGFsbCBkaWFsb2cgd2hpbGUgaW5zdGFsbGluZycpO1xuICAgIH1cbiAgICB0aGlzLl9hcHBJbnN0YWxsWkluZGV4ID0gZGlhbG9nLnN0eWxlLnpJbmRleDtcbiAgICBkaWFsb2cuc3R5bGUuekluZGV4ID0gNjU1Mzc7XG4gIH0gZWxzZSBpZiAoJ2RvbmUnID09PSBwcm9ncmVzcy5zdGFnZSB8fCAnZXJyb3InID09PSBwcm9ncmVzcy5zdGFnZSkge1xuICAgIGRpYWxvZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhcHAtaW5zdGFsbC1kaWFsb2cnKTtcbiAgICBpZiAoIWRpYWxvZykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyBpbnN0YWxsIGRpYWxvZyBhZnRlciBpbnN0YWxsaW5nJyk7XG4gICAgfVxuICAgIGRpYWxvZy5zdHlsZS56SW5kZXggPSB0aGlzLl9hcHBJbnN0YWxsWkluZGV4O1xuICAgIC8vIFhYWDogY2FuJ3QgaW52b2tlIGFuIGFwcCBqdXN0IGFmdGVyIGluc3RhbGwgaXQuXG4gICAgLy8gSSBzdXNwZWN0IGl0J3MgYSBidWcgYnV0IEkgZG9uJ3QgaGF2ZSBiZXR0ZXIgd2F5IHRvIGRvIHRoYXQuXG4gICAgdGhpcy50cnlEZWxheUludm9rZShwcm9ncmVzcy5uYW1lKTtcbiAgfVxufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUudHJ5RGVsYXlJbnZva2UgPSBmdW5jdGlvbihuYW1lKSB7XG4gIGNvbnNvbGUubG9nKCc+Pj4+Pj4+IHRyeSBkZWxheSBpbnZva2UnKTtcbiAgdGhpcy5pbnZva2VJbnN0YWxsZWQobmFtZSkudGhlbigoKSA9PiB7XG4gICAgY29uc29sZS5sb2coJz4+Pj4+PiBwcm9ncmVzcyBkZWxheSBpbnZva2UgZG9uZTogbmFtZTogJywgbmFtZSk7XG4gICAgdGhpcy5fcmV0cnlUaW1lID0gMDtcbiAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgIGlmICh0aGlzLl9yZXRyeVRpbWUgPiB0aGlzLl9yZXRyeU1heCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5cXCd0IGludm9rZSB0aGUgYXBwICcgKyBuYW1lICtcbiAgICAgICAgJyBhZnRlciAnICsgdGhpcy5fcmV0cnlNYXggKyAnIHRpbWVzJyk7XG4gICAgfVxuICAgIHRoaXMuX3JldHJ5VGltZSArPSAxO1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgLy8gWFhYOiBjYW4ndCBpbnZva2UgYW4gYXBwIGp1c3QgYWZ0ZXIgaW5zdGFsbCBpdCAofjMgb3IgNSBzZWNvbmRzKS5cbiAgICAgIC8vIEkgc3VzcGVjdCBpdCdzIGEgYnVnIGJ1dCBJIGRvbid0IGhhdmUgYmV0dGVyIHdheSB0byBkbyB0aGF0LlxuICAgICAgY29uc29sZS5lcnJvcignUmV0cnkgZHVlIHRvOiAnLCBlcnIpO1xuICAgICAgdGhpcy50cnlEZWxheUludm9rZShuYW1lKTtcbiAgICB9LCAyMDApO1xuICB9KTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbihzdGVwcykge1xuICBpZiAoIUFycmF5LmlzQXJyYXkoc3RlcHMpKSB7XG4gICAgc3RlcHMgPSBbc3RlcHNdO1xuICB9XG4gIHZhciBzdGVwUHJvbWlzZXMgPSBzdGVwcy5tYXAoKHN0ZXApID0+IHtcbiAgICByZXR1cm4gc3RlcCgpO1xuICB9KTtcbiAgdGhpcy5xdWV1ZSA9IHRoaXMucXVldWUudGhlbigoKSA9PiB7XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHN0ZXBQcm9taXNlcykuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcignPj4+PiBFcnJvciBpbiBpbm5lciBzdGVwcycsIGVycik7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfSk7XG4gIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICBjb25zb2xlLmVycm9yKCc+Pj4+IGNhdGNoIGVycm9yIGluIG5leHQnLCBlcnIpO1xuICAgIHRocm93IGVycjtcbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUub25Db25maWdPcGVuZWQgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuX3dhaXRpbmdUaW1lcikge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLl93YWl0aW5nVGltZXIpO1xuICB9XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5pbnZva2VJbnN0YWxsZWQgPSBmdW5jdGlvbihuYW1lKSB7XG4gIGNvbnNvbGUubG9nKCc+Pj4+Pj4gdHJ5IHRvIGludm9rZTogJywgbmFtZSk7XG4gIHJldHVybiB0aGlzLmZyb21OYW1lVG9JbnN0YWxsZWQobmFtZSlcbiAgICAudGhlbigoYXBwaW5mbykgPT4ge1xuICAgICAgaWYgKGFwcGluZm8pIHtcbiAgICAgICAgdGhpcy5fc3RvcmUuc3VibWl0RGVmYXVsdChuYW1lLCB0cnVlLCBhcHBpbmZvKTtcbiAgICAgICAgaWYgKHRoaXMuX2NvbmZpZ0ZyYW1lKSB7XG4gICAgICAgICAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuX2NvbmZpZ0ZyYW1lKTtcbiAgICAgICAgICB0aGlzLl9jb25maWdGcmFtZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2NvbnRlbnRGcmFtZSkge1xuICAgICAgICAgIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5yZW1vdmVDaGlsZCh0aGlzLl9jb250ZW50RnJhbWUpO1xuICAgICAgICAgIHRoaXMuX2NvbnRlbnRGcmFtZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sb2FkRGVmYXVsdCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBzdWNoIGNvbnRlbnQ6ICcsIG5hbWUpO1xuICAgICAgfVxuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9KTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLm9uU2NyZWVuQ2hhbmdlID0gZnVuY3Rpb24ocGFyc2VkKSB7XG4gIHZhciBzY3JlZW51cmwgPSBkZWNvZGVVUklDb21wb25lbnQocGFyc2VkKTtcbiAgdmFyIGxvY2FsID0gKG51bGwgPT09IHNjcmVlbnVybC5tYXRjaCgvXmh0dHAvKSk7XG4gIGNvbnNvbGUubG9nKCc+Pj4+PiBvblNjcmVlbkNoYW5nZTogJywgcGFyc2VkLCBsb2NhbCwgc2NyZWVudXJsKTtcbiAgaWYgKGxvY2FsKSB7XG4gICAgdmFyIG5hbWUgPSBzY3JlZW51cmw7XG4gICAgdGhpcy5pbnZva2VJbnN0YWxsZWQobmFtZSk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3N0YXR1c2JhcicpLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuX3N0b3JlLnN1Ym1pdERlZmF1bHQoc2NyZWVudXJsLCBsb2NhbCk7XG4gICAgaWYgKHRoaXMuX2NvbmZpZ0ZyYW1lKSB7XG4gICAgICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5fY29uZmlnRnJhbWUpO1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3N0YXR1c2JhcicpLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgdGhpcy5fY29uZmlnRnJhbWUgPSBudWxsO1xuICAgIH1cbiAgICBpZiAodGhpcy5fY29udGVudEZyYW1lKSB7XG4gICAgICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5fY29udGVudEZyYW1lKTtcbiAgICAgIHRoaXMuX2NvbnRlbnRGcmFtZSA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMubG9hZERlZmF1bHQoKTtcbiAgfVxufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUub25XYWludGluZ1NjcmVlblRpbWVvdXQgPSBmdW5jdGlvbigpIHtcbiAgLy8gVE9ETzogc2hvdyBmYWlsdXJlIGFuZCByZW1vdmUgdGhlIG1lc3NhZ2UgYW5kIGNvdmVyLlxufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUuc2hvd1dhaXRpbmdDb3ZlciA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgY29uc29sZS5sb2coJz4+Pj4+PiBzaG93V2FpdGluZ0NvdmVyJyk7XG4gICAgdmFyIGNvdmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY292ZXIudGV4dENvbnRlbnQgPSAnV2FpdGluZy4uLic7XG4gICAgY292ZXIuaWQgPSAnZm94bm9iLXdhaXRpbmctY292ZXInO1xuICAgIGNvdmVyLnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgICBjb3Zlci5zdHlsZS56SW5kZXggPSAnNjU1MzgnO1xuICAgIGNvdmVyLnN0eWxlLmp1c3RpZnlDb250ZW50ID0gJ2NlbnRlcic7XG4gICAgY292ZXIuc3R5bGUuYWxpZ25JdGVtcyA9ICdjZW50ZXInO1xuICAgIGNvdmVyLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgY292ZXIuc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gICAgY292ZXIuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xuICAgIGNvdmVyLnN0eWxlLmJhY2tncm91bmQgPSAnd2hlYXQnO1xuICAgIGNvdmVyLnN0eWxlLmNvbG9yID0gJyMzMzMzMzMnO1xuICAgIGNvdmVyLnN0eWxlLmZvbnRTaXplID0gJzRyZW0nO1xuICAgIHRoaXMuX3dhaXRpbmdDb3ZlciA9IGNvdmVyO1xuICAgIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5hcHBlbmRDaGlsZChjb3Zlcik7XG4gIH0pO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUucmVtb3ZlV2FpdGluZ0NvdmVyID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5fd2FpdGluZ0NvdmVyKTtcbiAgICB0aGlzLl93YWl0aW5nQ292ZXIgPSBudWxsO1xuICB9KTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLm9uT3BlbkNvbmZpZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnPj4+Pj4+Pj4+IG9uT3BlbkNvbmZpZycpO1xuICB2YXIgdXJsID0gJ2h0dHBzOi8vZm94a25vYi5oZXJva3VhcHAuY29tLyMnO1xuICB0aGlzLm5leHQoKCkgPT4ge1xuICAgIHJldHVybiB0aGlzLmFzc2VydENvbm5lY3Rpb24oKS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4+Pj4+IGFzc2VydCBjb25uZWN0aW9uIHN1Y2Nlc3NlZCcsIHJlc3VsdCk7XG4gICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coJz4+Pj4+PiBvbk9wZW5Db25maWcgaW4gY29ubmVjdGlvbiBlcnJvcicpO1xuICAgICAgdGhpcy5wcm9tcHROb0Nvbm5lY3Rpb24odXJsKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9KTtcbiAgfSlcbiAgLm5leHQodGhpcy5zaG93V2FpdGluZ0NvdmVyLmJpbmQodGhpcykpXG4gIC5uZXh0KCgpID0+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnPj4+Pj4gb3BlbiBjb25maWcgY3JlYXRlIGZyYW1lJywgdGhpcy5fY29uZmlnRnJhbWUpO1xuICAgICAgaWYgKHRoaXMuX2NvbmZpZ0ZyYW1lKSB7XG4gICAgICAgIC8vIFJlbW92ZSB0aGUgb2xkIGNvbmZpZyBmcmFtZS5cbiAgICAgICAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuX2NvbmZpZ0ZyYW1lKTtcbiAgICAgICAgdGhpcy5fY29uZmlnRnJhbWUgPSBudWxsO1xuICAgICAgfVxuICAgICAgdGhpcy5fd2FpdGluZ1RpbWVyID1cbiAgICAgICAgc2V0VGltZW91dCh0aGlzLm9uV2FpbnRpbmdTY3JlZW5UaW1lb3V0LCB0aGlzLlNDUkVFTl9USU1FT1VUKTtcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4+PiBzZXQgdGltZW91dCcpO1xuICAgICAgdmFyIGlmcmFtZSA9IHRoaXMuY3JlYXRlU2NyZWVuRnJhbWUoKTtcbiAgICAgIGlmcmFtZS5jbGFzc0xpc3QuYWRkKCdmb3hub2ItY29uZmlnJyk7XG4gICAgICBpZnJhbWUuc3R5bGUuekluZGV4ID0gJzY1NTM1JztcbiAgICAgIGlmcmFtZS5zcmMgPSB1cmw7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc3RhdHVzYmFyJykuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIHRoaXMuX2NvbmZpZ0ZyYW1lID0gaWZyYW1lO1xuICAgICAgY29uc29sZS5sb2coJz4+Pj4+IGFwcGVuZCcpO1xuICAgICAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gICAgICBjb25zb2xlLmxvZygnPj4+Pj4+IGFkZCBldmVudCBsaXN0ZW5lciBsb2NhdGlvbiBub3cnKTtcbiAgICAgIGlmcmFtZS5hZGRFdmVudExpc3RlbmVyKCdtb3picm93c2VybG9jYXRpb25jaGFuZ2UnLCB0aGlzKTtcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4+PiBkb25lJyk7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUuY3JlYXRlU2NyZWVuRnJhbWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuICBpZnJhbWUuaWQgPSAnZm94bm9iLWFjdGl2YXRlZC1zY3JlZW4nO1xuICBpZnJhbWUuc2V0QXR0cmlidXRlKCdtb3picm93c2VyJywgJ3RydWUnKTtcbiAgaWZyYW1lLnNldEF0dHJpYnV0ZSgncmVtb3RlJywgJ3RydWUnKTtcbiAgaWZyYW1lLnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgcmV0dXJuIGlmcmFtZTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLnByb21wdE5vQ29ubmVjdGlvbiA9IGZ1bmN0aW9uKHVybCkge1xuICBjb25zb2xlLmxvZygnPj4+Pj4+IG5vIGNvbm5lY3Rpb24nKTtcbiAgdmFyIGNvdmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGNvdmVyLnRleHRDb250ZW50ID0gJ05vIENvbm5lY3Rpb24hIFt4XSc7XG4gIGNvdmVyLmlkID0gJ2ZveG5vYi13YWl0aW5nLWNvdmVyJztcbiAgY292ZXIuc3R5bGUucG9zaXRpb24gPSAnZml4ZWQnO1xuICBjb3Zlci5zdHlsZS56SW5kZXggPSAnNjU1MzgnO1xuICBjb3Zlci5zdHlsZS5qdXN0aWZ5Q29udGVudCA9ICdjZW50ZXInO1xuICBjb3Zlci5zdHlsZS5hbGlnbkl0ZW1zID0gJ2NlbnRlcic7XG4gIGNvdmVyLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gIGNvdmVyLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICBjb3Zlci5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG4gIGNvdmVyLnN0eWxlLmJhY2tncm91bmQgPSAnd2hlYXQnO1xuICBjb3Zlci5zdHlsZS5jb2xvciA9ICcjMzMzMzMzJztcbiAgY292ZXIuc3R5bGUuZm9udFNpemUgPSAnMnJlbSc7XG4gIHRoaXMuX2Vycm9yQ292ZXIgPSBjb3ZlcjtcbiAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvdmVyKTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLmxvYWREZWZhdWx0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciB7IHVybCwgbWFuaWZlc3QgfSA9IHRoaXMuX3N0b3JlLmZldGNoRGVmYXVsdCgnZm94bm9iLWRlZmF1bHQnKTtcbiAgdmFyIGlmcmFtZSA9IHRoaXMuY3JlYXRlU2NyZWVuRnJhbWUoKTtcbiAgY29uc29sZS5sb2coJz4+Pj4gd2FudCB0byBsb2FkIGRlZmF1bHQ6ICcsIHVybCwgbWFuaWZlc3QpO1xuICAvLyBSZW1vdGUuIE5lZWQgaW50ZXJuZXQuXG4gIGlmICghbWFuaWZlc3QpIHtcbiAgICB0aGlzLmFzc2VydENvbm5lY3Rpb24oKS50aGVuKCgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4gbm8gbWFuaWZlc3QnKTtcbiAgICAgIGlmcmFtZS5zdHlsZS56SW5kZXggPSAnMSc7XG4gICAgICBpZnJhbWUuc3R5bGUuYmFja2dyb3VuZCA9ICdibGFjayc7XG4gICAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdzcmMnLCB1cmwpO1xuICAgICAgdGhpcy5fY29udGVudEZyYW1lID0gaWZyYW1lO1xuICAgICAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgdGhpcy5wcm9tcHROb0Nvbm5lY3Rpb24odXJsKTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmxvZygnPj4+IHdpdGggbWFuaWZlc3QnKTtcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdzcmMnLCB1cmwpO1xuICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ21vemFwcCcsIG1hbmlmZXN0KTtcbiAgICBpZnJhbWUuc3R5bGUuYmFja2dyb3VuZCA9ICdibGFjayc7XG4gICAgaWZyYW1lLnN0eWxlLnpJbmRleCA9ICcxJztcbiAgICB0aGlzLl9jb250ZW50RnJhbWUgPSBpZnJhbWU7XG4gICAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gIH1cbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLmZyb21OYW1lVG9JbnN0YWxsZWQgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiBuYXZpZ2F0b3IubW96QXBwcy5tZ210LmdldEFsbCgpXG4gICAgLnRoZW4oKGFwcHMpID0+IHtcbiAgICAgIHJldHVybiBhcHBzLmZpbHRlcigoYXBwKSA9PiB7XG4gICAgICAgIGlmIChhcHAubWFuaWZlc3QpIHtcbiAgICAgICAgICByZXR1cm4gKG5hbWUgPT09IGFwcC5tYW5pZmVzdC5uYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pWzBdO1xuICAgIH0pO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUuYXNzZXJ0Q29ubmVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbG9jayA9IG5hdmlnYXRvci5tb3pTZXR0aW5ncy5jcmVhdGVMb2NrKCk7XG4gIHZhciB3aWZpID0gbG9jay5nZXQoJ3dpZmkuZW5hYmxlZCcpLnRoZW4oKHIpID0+IHsgcmV0dXJuIHJbJ3dpZmkuZW5hYmxlZCddO30pO1xuICB2YXIgcmlsZGF0YSA9IGxvY2suZ2V0KCdyaWwuZGF0YS5lbmFibGVkJykudGhlbigocikgPT4geyByZXR1cm4gclsncmlsLmRhdGEuZW5hYmxlZCddO30pO1xuICByZXR1cm4gUHJvbWlzZS5hbGwoW3dpZmksIHJpbGRhdGFdKS50aGVuKChycykgPT4ge1xuICAgIGlmIChyc1swXSB8fCByc1sxXSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ05vIGNvbm5lY3Rpb246ICcsIHJzWzBdLCByc1sxXSk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGNvbm5lY3Rpb246ICcpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5sb2FkRHVtbXlTY3JlZW5MZWZ0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgdmFyIG9sZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhY3RpdmF0ZWQtbG9ja3NjcmVlbi1jb250ZW50Jyk7XG4gIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5yZW1vdmVDaGlsZChvbGQpO1xuICBpZnJhbWUuaWQgPSAnYWN0aXZhdGVkLWxvY2tzY3JlZW4tY29udGVudCc7XG4gIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ21vemJyb3dzZXInLCAndHJ1ZScpO1xuICBpZnJhbWUuc2V0QXR0cmlidXRlKCdyZW1vdGUnLCAndHJ1ZScpO1xuICBpZnJhbWUuc3JjID0gJ2FwcDovL2NhbGVuZGFyLmdhaWFtb2JpbGUub3JnL2luZGV4Lmh0bWwnO1xuICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLmxvYWREdW1teVNjcmVlblJpZ2h0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgdmFyIG9sZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhY3RpdmF0ZWQtbG9ja3NjcmVlbi1jb250ZW50Jyk7XG4gIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5yZW1vdmVDaGlsZChvbGQpO1xuICBpZnJhbWUuaWQgPSAnYWN0aXZhdGVkLWxvY2tzY3JlZW4tY29udGVudCc7XG4gIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ21vemJyb3dzZXInLCAndHJ1ZScpO1xuICBpZnJhbWUuc2V0QXR0cmlidXRlKCdyZW1vdGUnLCAndHJ1ZScpO1xuICBpZnJhbWUuc3JjID0gJ2FwcDovL2Nsb2NrLmdhaWFtb2JpbGUub3JnL2luZGV4Lmh0bWwnO1xuICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLndhaXRMb2NrU2NyZWVuID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXNvbHZlO1xuICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChfciwgX2opID0+IHtcbiAgICByZXNvbHZlID0gX3I7XG4gIH0pO1xuICB2YXIgc29sdmVJdCA9IGZ1bmN0aW9uIHNvbHZlSXQoKSB7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2xvY2tzY3JlZW4tYXBwb3BlbmVkJywgc29sdmVJdCk7XG4gICAgcmVzb2x2ZSgpO1xuICB9O1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9ja3NjcmVlbi1hcHBvcGVuZWQnLCBzb2x2ZUl0KTtcbiAgcmV0dXJuIHByb21pc2U7XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5zZXR1cEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAvL25hdmlnYXRvci5tb3pBcHBzLm1nbXQuYWRkRXZlbnRMaXN0ZW5lcignZW5hYmxlZHN0YXRlY2hhbmdlJywgdGhpcyk7XG4gIC8vbmF2aWdhdG9yLm1vekFwcHMubWdtdC5hZGRFdmVudExpc3RlbmVyKCd1bmluc3RhbGwnLCB0aGlzKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcyk7XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5zZXR1cEVsZW1lbnRzID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuZWxlbWVudHMud2luZG93ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmFwcFdpbmRvdy5sb2NrU2NyZWVuV2luZG93Jyk7XG4gIGlmICghdGhpcy5lbGVtZW50cy53aW5kb3cgfHwgIXRoaXMuZWxlbWVudHMud2luZG93LmNsYXNzTGlzdC5jb250YWlucygnYWN0aXZlJykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIExvY2tTY3JlZW4gd2hpbGUgc2V0dGluZyB1cC4nKTtcbiAgfVxuICB0aGlzLmVsZW1lbnRzLmZyYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xvY2tzY3JlZW4tZnJhbWUnKTtcbiAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyID0gdGhpcy5lbGVtZW50cy5mcmFtZS5wYXJlbnRFbGVtZW50O1xuICB0aGlzLmVsZW1lbnRzLmJhY2tncm91bmQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbG9ja3NjcmVlbi1iYWNrZ3JvdW5kJyk7XG5cbiAgdGhpcy5vcmlnaW5hbHMuYmFja2dyb3VuZEltYWdlID0gdGhpcy5lbGVtZW50cy5iYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRJbWFnZTtcbiAgdGhpcy5vcmlnaW5hbHMuYmFja2dyb3VuZENvbG9yID0gdGhpcy5lbGVtZW50cy5iYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRDb2xvcjtcbiAgdGhpcy5vcmlnaW5hbHMuYnJvd3NlckNvbnRhaW5lckJhY2tncm91bmQgPSB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIuc3R5bGUuYmFja2dyb3VuZDtcblxuICB0aGlzLmVsZW1lbnRzLmJhY2tncm91bmQuc3R5bGUuYmFja2dyb3VuZCA9ICdub25lJztcbiAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLmJhY2tncm91bmQgPSAnbm9uZSc7XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5vbkVuYWJsZSA9IGZ1bmN0aW9uKCkge1xuXG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5vbkRpc2FibGUgPSBmdW5jdGlvbigpIHtcblxufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUub25MZWZ0TG9ja1NjcmVlbiA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnPj4+PiBvbiBsZWZ0IGxvY2tzY3JlZW4nKTtcbiAgdGhpcy5sb2FkRHVtbXlTY3JlZW5MZWZ0KCk7XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5vblJpZ2h0TG9ja1NjcmVlbiA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnPj4+PiBvbiByaWdodCBsb2Nrc2NyZWVuJyk7XG4gIHRoaXMubG9hZER1bW15U2NyZWVuUmlnaHQoKTtcbn07XG5cbi8qXG5Db250cm9sbGVyLnByb3RvdHlwZS5oYW5kbGVFdmVudCA9IGZ1bmN0aW9uKGUpIHtcbiAgLy8gZGVidWcgYXQgYWlyXG4gIC8vIHZhciBNQU5JRkVTVF9VUkwgPSAnYXBwOi8vZDhkYzYwYzAtYTdiMC0wMTRiLTg2NTktYWU1N2NhN2Y1ZmNhL21hbmlmZXN0LndlYmFwcCc7XG4gIC8vIG9ubGluZSB2ZXJzaW9uXG4gIHZhciBNQU5JRkVTVF9VUkwgPSAnaHR0cHM6Ly9ncmVnLXdlbmcuZ2l0aHViLmlvL3JlcGxhY2FibGUtbG9ja3NjcmVlbnMvbWFuaWZlc3Qud2ViYXBwJztcbiAgaWYgKGUuYXBwbGljYXRpb24ubWFuaWZlc3RVUkwgIT09IE1BTklGRVNUX1VSTCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHN3aXRjaChlLnR5cGUpIHtcbiAgICBjYXNlICdlbmFibGVkc3RhdGVjaGFuZ2UnOlxuICAgICAgaWYgKGUuYXBwbGljYXRpb24uZW5hYmxlZCkge1xuICAgICAgICB0aGlzLm5leHQodGhpcy5vbkVuYWJsZS5iaW5kKHRoaXMpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubmV4dCh0aGlzLm9uRGlzYWJsZS5iaW5kKHRoaXMpKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3VuaW5zdGFsbCc6XG4gICAgICB0aGlzLm5leHQodGhpcy5vblVuaW5zdGFsbC5iaW5kKHRoaXMpKTtcbiAgICAgIGJyZWFrO1xuICB9XG59O1xuKi9cblxuQ29udHJvbGxlci5wcm90b3R5cGUub25Vbmluc3RhbGwgPSBmdW5jdGlvbigpIHtcbiAgbmF2aWdhdG9yLm1vekFwcHMubWdtdC5yZW1vdmVFdmVudExpc3RlbmVyKCdlbmFibGVkc3RhdGVjaGFuZ2UnLCB0aGlzKTtcbiAgbmF2aWdhdG9yLm1vekFwcHMubWdtdC5yZW1vdmVFdmVudExpc3RlbmVyKCd1bmluc3RhbGwnLCB0aGlzKTtcbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9Db250cm9sbGVyLmpzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBnbG9iYWwgSGFtbWVyICovXG5cbmV4cG9ydCBmdW5jdGlvbiBHZXN0dXJlQ29udHJvbGxlcigpIHt9XG5HZXN0dXJlQ29udHJvbGxlci5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5xdWV1ZSA9IFByb21pc2UucmVzb2x2ZSgpO1xuICB0aGlzLnNldHVwQ292ZXIoKTtcbiAgdmFyIGhhbW1lciAgICA9IG5ldyBIYW1tZXIuTWFuYWdlcih0aGlzLmNvdmVyKTtcbiAgdmFyIHN3aXBlICAgICA9IG5ldyBIYW1tZXIuU3dpcGUoKTtcbiAgaGFtbWVyLmFkZChzd2lwZSk7XG4gIGhhbW1lci5vbignc3dpcGVsZWZ0JywgKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKCc8PDw8PDwgbGVmdCcpO1xuICAgIHRoaXMubmV4dCh0aGlzLmxlZnRCaW5kZXJzKS5uZXh0KCgpID0+IHtjb25zb2xlLmxvZygnPDw8PDw8IGFmdGVyIGxlZnQnKTt9KTtcbiAgfSk7XG4gIGhhbW1lci5vbignc3dpcGVyaWdodCcsICgpID0+IHtcbiAgICBjb25zb2xlLmxvZygnPj4+Pj4gcmlnaHQnKTtcbiAgICB0aGlzLm5leHQodGhpcy5yaWdodEJpbmRlcnMpLm5leHQoKCkgPT4ge2NvbnNvbGUubG9nKCc+Pj4+Pj4gYWZ0ZXIgcmlnaHQnKTt9KTtcbiAgfSk7XG4gIGhhbW1lci5vbignc3dpcGV1cCcsICgpID0+IHtcbiAgICBjb25zb2xlLmxvZygnXl5eXl5eXiB1cCcsIHRoaXMudXBCaW5kZXJzLmxlbmd0aCk7XG4gICAgdGhpcy5uZXh0KHRoaXMudXBCaW5kZXJzKS5uZXh0KCgpID0+IHtjb25zb2xlLmxvZygnXl5eXl5eXl4gYWZ0ZXIgdXAnKTt9KTtcbiAgfSk7XG4gIHRoaXMubGVmdEJpbmRlcnMgPSBbXTtcbiAgdGhpcy5yaWdodEJpbmRlcnMgPSBbXTtcbiAgdGhpcy51cEJpbmRlcnMgPSBbXTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5HZXN0dXJlQ29udHJvbGxlci5wcm90b3R5cGUuc2V0dXBDb3ZlciA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmNvdmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHRoaXMuY292ZXIuaWQgPSAnZm94bm9iLWNvdmVyJztcbiAgLy8gZGVidWcgY29sb3JcbiAgLy90aGlzLmNvdmVyLnN0eWxlLmJhY2tncm91bmQgPSAncmdiYSgwLCAxMDAsIDAsIDAuMSknO1xuICB0aGlzLmNvdmVyLnN0eWxlLndpZHRoID0gICcxMDAlJztcbiAgdGhpcy5jb3Zlci5zdHlsZS5oZWlnaHQgPSAnODAlJztcbiAgdGhpcy5jb3Zlci5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gIHRoaXMuY292ZXIuc3R5bGUudG9wID0gJzQwcHgnO1xuICB0aGlzLmNvdmVyLnN0eWxlLnpJbmRleCA9ICc4Jztcbn07XG5cbkdlc3R1cmVDb250cm9sbGVyLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24oc3RlcHMpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KHN0ZXBzKSkge1xuICAgIHN0ZXBzID0gW3N0ZXBzXTtcbiAgfVxuICB2YXIgc3RlcFByb21pc2VzID0gc3RlcHMubWFwKChzdGVwKSA9PiB7XG4gICAgcmV0dXJuIHN0ZXAoKTtcbiAgfSk7XG4gIHRoaXMucXVldWUgPSB0aGlzLnF1ZXVlLnRoZW4oKCkgPT4ge1xuICAgIHJldHVybiBQcm9taXNlLmFsbChzdGVwUHJvbWlzZXMpO1xuICB9KS5jYXRjaChjb25zb2xlLmVycm9yLmJpbmQoY29uc29sZSkpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkdlc3R1cmVDb250cm9sbGVyLnByb3RvdHlwZS5iaW5kT25MZWZ0ID0gZnVuY3Rpb24oY2IpIHtcbiAgdGhpcy5sZWZ0QmluZGVycy5wdXNoKGNiKTtcbn07XG5cbkdlc3R1cmVDb250cm9sbGVyLnByb3RvdHlwZS5iaW5kT25SaWdodCA9IGZ1bmN0aW9uKGNiKSB7XG4gIHRoaXMucmlnaHRCaW5kZXJzLnB1c2goY2IpO1xufTtcblxuR2VzdHVyZUNvbnRyb2xsZXIucHJvdG90eXBlLmJpbmRPblVwID0gZnVuY3Rpb24oY2IpIHtcbiAgdGhpcy51cEJpbmRlcnMucHVzaChjYik7XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvR2VzdHVyZUNvbnRyb2xsZXIuanNcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBTdG9yZSgpIHt9XG5TdG9yZS5wcm90b3R5cGUuZmV0Y2hEZWZhdWx0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdmb3hub2ItZGVmYXVsdCcpKTtcbn07XG5cblN0b3JlLnByb3RvdHlwZS5zdWJtaXREZWZhdWx0ID0gZnVuY3Rpb24odXJsLCBsb2NhbCwgcGF5bG9hZCkge1xuICBpZiAobG9jYWwpIHtcbiAgICB1cmwgPSBwYXlsb2FkLm9yaWdpbjtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnZm94bm9iLWRlZmF1bHQnLFxuICAgICAgSlNPTi5zdHJpbmdpZnkoeyAndXJsJzogcGF5bG9hZC5vcmlnaW4gKyBwYXlsb2FkLm1hbmlmZXN0LmxhdW5jaF9wYXRoICsgJyNzZWN1cmUnLFxuICAgICAgICAgICAgICAgICAgICAgJ21hbmlmZXN0JzogcGF5bG9hZC5tYW5pZmVzdFVSTCB9KSk7XG4gICAgY29uc29sZS5sb2coJz4+Pj4+Pj4gc3VibWl0bG9jYWxkZWZhdWx0OiAnLCBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnZm94bm9iLWRlZmF1bHQnKSk7XG4gIH0gZWxzZSB7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2ZveG5vYi1kZWZhdWx0JyxcbiAgICAgIEpTT04uc3RyaW5naWZ5KHsgJ3VybCc6IHVybCwgJ21hbmlmZXN0JzogbnVsbH0pKTtcbiAgICBjb25zb2xlLmxvZygnPj4+Pj4+PiBzdWJtaXROT1REZWZhdWx0OiAnLCBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnZm94bm9iLWRlZmF1bHQnKSk7XG4gIH1cbn07XG5cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL1N0b3JlLmpzXG4gKiovIl0sInNvdXJjZVJvb3QiOiIifQ==