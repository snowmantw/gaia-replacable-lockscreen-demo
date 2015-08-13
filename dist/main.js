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
	
	  this._store = new _srcStoreJs.Store();
	  this._configFrame = null;
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
	  //    .then(this.waitLockScreen.bind(this)).then(this.label.bind(this, '>>> wait lockscreen done'))
	  .then(this.setupElements.bind(this)).then(this.label.bind(this, '>>> set elements done')).then(this.setupGesture.bind(this)).then(this.label.bind(this, '>>> set gesture done'))
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
	      this.next(this.onScreenChange.bind(this, evt.detail));
	      break;
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
	    return Promise.all(stepPromises);
	  })['catch'](console.error.bind(console));
	  return this;
	};
	
	Controller.prototype.onScreenChange = function (url) {
	  console.log('>>>>>>> locationchanged');
	  var hash = url.replace(/^.*#/, '');
	  var parsed = hash.replace(/screenname-/, '');
	  console.log('>>>>>> url:', url, hash, parsed);
	  if ('' !== hash) {
	    var screenurl = decodeURIComponent(parsed);
	    var local = null === screenurl.match(/^http/);
	    this._store.submitDefault(screenurl, local);
	    console.log('>>>> launch the new screen', screenurl);
	    this.elements.browserContainer.removeChild(this._configFrame);
	    this.loadDefault();
	  }
	};
	
	Controller.prototype.onOpenConfig = function () {
	  var iframe = document.createElement('iframe');
	  this._configFrame = iframe;
	  iframe.style.zIndex = '16';
	  iframe.style.position = 'relative';
	  iframe.style.width = '250px';
	  iframe.style.height = '350px';
	  iframe.id = 'foxnob-config';
	  iframe.setAttribute('mozbrowser', 'true');
	  iframe.setAttribute('remote', 'true');
	  iframe.src = 'https://foxknob.herokuapp.com/#';
	  this.elements.browserContainer.appendChild(iframe);
	  iframe.addEventListener('mozbrowserlocationchange', this);
	};
	
	Controller.prototype.createScreenFrame = function () {
	  var iframe = document.createElement('iframe');
	  iframe.id = 'foxnob-activated-screen';
	  iframe.setAttribute('mozbrowser', 'true');
	  iframe.setAttribute('remote', 'true');
	  return iframe;
	};
	
	Controller.prototype.promptNoConnection = function (url) {
	  console.error('No Internet Connection for the Screen: ', url);
	};
	
	Controller.prototype.loadDefault = function () {
	  var _this3 = this;
	
	  var _store$fetchDefault = this._store.fetchDefault('foxnob-default');
	
	  var url = _store$fetchDefault.url;
	  var manifest = _store$fetchDefault.manifest;
	
	  var iframe = this.createScreenFrame();
	  console.log('>>>> want to load default: ', url, manifest);
	  // Remote. Need internet.
	  if (!manifest) {
	    this.assertConnection().then(function () {
	      iframe.src = url;
	      _this3.elements.browserContainer.appendChild(iframe);
	    })['catch'](function () {
	      _this3.promptNoConnection(url);
	    });
	  } else {
	    iframe.src = url;
	    this.elements.browserContainer.appendChild(iframe);
	  }
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
	    console.log('^^^^^^^ up');
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
	  this.cover.style.background = 'rgba(0, 100, 0, 0.1)';
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
	
	Store.prototype.submitDefault = function (url, local) {
	  var manifestUrl;
	  if (local) {
	    var name = url;
	    //url = window.parent.location.href.replace('system', name);
	    url = window.parent.location.href.replace(window.location.hostname, name);
	    manifestUrl = url.replace(/(\/)*(index.html#?)*$/, '/manifest.webapp');
	    url += '#secure';
	  }
	  localStorage.setItem('foxnob-default', JSON.stringify({ 'url': url, 'manifest': manifestUrl }));
	};

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgYjQ1YzdiZTZjMGQzZWNlYTJiYzUiLCJ3ZWJwYWNrOi8vLy4vc3JjL1N0YXJ0dXAuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL0NvbnRyb2xsZXIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL0dlc3R1cmVDb250cm9sbGVyLmpzIiwid2VicGFjazovLy8uL3NyYy9TdG9yZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7OztBQ3RDQSxhQUFZLENBQUM7OzRDQUNjLENBQW1COztBQUM5QyxFQUFDLFlBQVk7QUFDWCxXQUFRLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLEVBQUUsU0FBUyxnQkFBZ0IsR0FBRztBQUN4RSxZQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDakMsU0FBSSxNQUFNLEdBQUUscUJBSlAsVUFBVSxFQUlhLENBQUM7QUFDN0IsV0FBTSxDQUFDLEtBQUssRUFBRSxDQUFDOzs7Ozs7Ozs7SUFTaEIsQ0FBQyxDQUFDO0VBQ0osR0FBRyxDOzs7Ozs7QUNoQkosYUFBWSxDQUFDOzs7O1NBR0csVUFBVSxHQUFWLFVBQVU7O21EQUZRLENBQTBCOzt1Q0FDdEMsQ0FBYzs7QUFDN0IsVUFBUyxVQUFVLEdBQUcsRUFBRTs7QUFDL0IsV0FBVSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsWUFBVzs7O0FBQ3RDLE9BQUksQ0FBQyxNQUFNLEdBQUcsZ0JBSFAsS0FBSyxFQUdhLENBQUM7QUFDMUIsT0FBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7QUFDekIsVUFBTyxDQUFDLEdBQUcsQ0FBQyww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RCxPQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUN6QixDOzs7Ozs7QUMvREQsYUFBWSxDQUFDOzs7OztTQUVHLEtBQUssR0FBTCxLQUFLOztBQUFkLFVBQVMsS0FBSyxHQUFHLEVBQUU7O0FBQzFCLE1BQUssQ0FBQyxTQUFTLENBQUMsWUFBWSxHQUFHLFlBQVc7QUFDeEMsVUFBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO0VBQzNELENBQUM7O0FBRUYsTUFBSyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEdBQUcsVUFBUyxHQUFHLEVBQUUsS0FBSyxFQUFFO0FBQ25ELE9BQUksV0FBVyxDQUFDO0FBQ2hCLE9BQUksS0FBSyxFQUFFO0FBQ1QsU0FBSSxJQUFJLEdBQUcsR0FBRyxDQUFDOztBQUVmLFFBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzFFLGdCQUFXLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0FBQ3ZFLFFBQUcsSUFBSSxTQUFTLENBQUM7SUFDbEI7QUFDRCxlQUFZLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUNuQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQzVELEMiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay9ib290c3RyYXAgYjQ1YzdiZTZjMGQzZWNlYTJiYzVcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5pbXBvcnQgeyBDb250cm9sbGVyIH0gZnJvbSAnc3JjL0NvbnRyb2xsZXIuanMnO1xuKGZ1bmN0aW9uICgpIHtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncmVhZHlzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uIHJlYWR5U3RhdGVDaGFuZ2UoKSB7XG4gICAgY29uc29sZS5sb2coJz4+Pj4+Pj4+IGluIGFkZG9uJyk7XG4gICAgdmFyIGZveG5vYj0gbmV3IENvbnRyb2xsZXIoKTtcbiAgICBmb3hub2Iuc3RhcnQoKTtcbiAgICAvKlxuICAgIGNvbnNvbGUubG9nKCc+Pj4+Pj4+PiBpbiBhZGRvbicpO1xuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnaW50ZXJhY3RpdmUnKSB7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdyZWFkeXN0YXRlY2hhbmdlJywgcmVhZHlTdGF0ZUNoYW5nZSk7XG4gICAgICB2YXIgZm94bm9iPSBuZXcgQ29udHJvbGxlcigpO1xuICAgICAgZm94bm9iLnN0YXJ0KCk7XG4gICAgfVxuICAgICovXG4gIH0pO1xufSkoKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL1N0YXJ0dXAuanNcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5pbXBvcnQgeyBHZXN0dXJlQ29udHJvbGxlciB9IGZyb20gJ3NyYy9HZXN0dXJlQ29udHJvbGxlci5qcyc7XG5pbXBvcnQgeyBTdG9yZSB9IGZyb20gJ3NyYy9TdG9yZS5qcyc7XG5leHBvcnQgZnVuY3Rpb24gQ29udHJvbGxlcigpIHt9XG5Db250cm9sbGVyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9zdG9yZSA9IG5ldyBTdG9yZSgpO1xuICB0aGlzLl9jb25maWdGcmFtZSA9IG51bGw7XG4gIGNvbnNvbGUubG9nKCc+Pj4+IHRyeSB0byBsYXVuY2ggYWRkb24nKTtcbiAgLy8gVE9ETzogMS4gaWYgd2UgaGF2ZSBzZXR0aW5ncyB0byBrbm93IGhvdyBtYW55IExTVyBjb3VsZCBiZSBpbmplY3RlZCxcbiAgLy8gICAgICAgICAgcmVhZCBpdCBoZXJlLlxuICAvLyAgICAgICAyLiBzb21lIGR1bW15IGZ1bmN0aW9uIG5lZWQgdG8gYmUgZmlsbGVkIGxhdGVyLlxuICB0aGlzLnF1ZXVlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5lbGVtZW50cyA9IHt9O1xuICAgICAgdGhpcy5vcmlnaW5hbHMgPSB7fTtcbiAgICAgIC8vIFRPRE86IHNob3VsZCByZWFkIGNvbmZpZyBoZXJlXG4gICAgICByZXNvbHZlKCk7XG4gICAgfSlcbi8vICAgIC50aGVuKHRoaXMuc2V0dXBFdmVudHMuYmluZCh0aGlzKSkudGhlbih0aGlzLmxhYmVsLmJpbmQodGhpcywgJz4+PiBsYXVuY2hpbmcnKSlcbi8vICAgIC50aGVuKHRoaXMud2FpdExvY2tTY3JlZW4uYmluZCh0aGlzKSkudGhlbih0aGlzLmxhYmVsLmJpbmQodGhpcywgJz4+PiB3YWl0IGxvY2tzY3JlZW4gZG9uZScpKVxuICAgIC50aGVuKHRoaXMuc2V0dXBFbGVtZW50cy5iaW5kKHRoaXMpKS50aGVuKHRoaXMubGFiZWwuYmluZCh0aGlzLCAnPj4+IHNldCBlbGVtZW50cyBkb25lJykpXG4gICAgLnRoZW4odGhpcy5zZXR1cEdlc3R1cmUuYmluZCh0aGlzKSkudGhlbih0aGlzLmxhYmVsLmJpbmQodGhpcywgJz4+PiBzZXQgZ2VzdHVyZSBkb25lJykpXG4vLyAgICAudGhlbih0aGlzLmxvYWREZWZhdWx0LmJpbmQodGhpcykpLnRoZW4odGhpcy5sYWJlbC5iaW5kKHRoaXMsICc+Pj4gbG9hZCBkZWZhdWx0IG9uZScpKVxuICAgIC5jYXRjaCh0aGlzLm9uTWFpblByb21pc2VFcnJvci5iaW5kKHRoaXMpKTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLmxhYmVsID0gZnVuY3Rpb24obGIpIHtcbiAgY29uc29sZS5sb2cobGIpO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUub25NYWluUHJvbWlzZUVycm9yID0gZnVuY3Rpb24oZXJyKSB7XG4gIGNvbnNvbGUuZXJyb3IoJz4+PiBDb250cm9sbGVyIEVycm9yOiAnLCBlcnIpO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUuc2V0dXBHZXN0dXJlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2dlc3R1cmVDb250cm9sbGVyID0gbmV3IEdlc3R1cmVDb250cm9sbGVyKCk7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdGhpcy5fZ2VzdHVyZUNvbnRyb2xsZXIuc3RhcnQoKVxuICAgIC5uZXh0KCgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4+IGJpbmQgZ2VzdHVyZSBpbiBDb250cm9sbGVyJyk7XG4gICAgICB0aGlzLl9nZXN0dXJlQ29udHJvbGxlci5iaW5kT25MZWZ0KHRoaXMub25MZWZ0TG9ja1NjcmVlbi5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuX2dlc3R1cmVDb250cm9sbGVyLmJpbmRPblJpZ2h0KHRoaXMub25SaWdodExvY2tTY3JlZW4uYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLl9nZXN0dXJlQ29udHJvbGxlci5iaW5kT25VcCh0aGlzLm9uT3BlbkNvbmZpZy5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLl9nZXN0dXJlQ29udHJvbGxlci5jb3Zlcik7XG4gICAgfSlcbiAgICAubmV4dCgoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnPj4+PiBlbmRpbmcgZ2VzdHVyZSBzZXR1cCBpbiBDb250cm9sbGVyJyk7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUuaGFuZGxlRXZlbnQgPSBmdW5jdGlvbihldnQpIHtcbiAgc3dpdGNoIChldnQudHlwZSkge1xuICAgIGNhc2UgJ21vemJyb3dzZXJsb2NhdGlvbmNoYW5nZSc6XG4gICAgICAvLyBUT0RPOiBjYW4gcHJldmlldyB0aGUgVUkgYmVmb3JlIGFwcGx5IHRoYXQ6XG4gICAgICAvLyBhZGQgYSBmaWVsZCBpbiB0aGUgaGFzaC5cbiAgICAgIGNvbnNvbGUubG9nKCc+Pj4+Pj4+IGxvY2F0aW9uY2hhbmdlZCcsIGV2dCk7XG4gICAgICB0aGlzLm5leHQodGhpcy5vblNjcmVlbkNoYW5nZS5iaW5kKHRoaXMsIGV2dC5kZXRhaWwpKTtcbiAgICAgIGJyZWFrO1xuICB9XG59O1xuXG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbihzdGVwcykge1xuICBpZiAoIUFycmF5LmlzQXJyYXkoc3RlcHMpKSB7XG4gICAgc3RlcHMgPSBbc3RlcHNdO1xuICB9XG4gIHZhciBzdGVwUHJvbWlzZXMgPSBzdGVwcy5tYXAoKHN0ZXApID0+IHtcbiAgICByZXR1cm4gc3RlcCgpO1xuICB9KTtcbiAgdGhpcy5xdWV1ZSA9IHRoaXMucXVldWUudGhlbigoKSA9PiB7XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHN0ZXBQcm9taXNlcyk7XG4gIH0pLmNhdGNoKGNvbnNvbGUuZXJyb3IuYmluZChjb25zb2xlKSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUub25TY3JlZW5DaGFuZ2UgPSBmdW5jdGlvbih1cmwpIHtcbiAgY29uc29sZS5sb2coJz4+Pj4+Pj4gbG9jYXRpb25jaGFuZ2VkJyk7XG4gIHZhciBoYXNoID0gdXJsLnJlcGxhY2UoL14uKiMvLCAnJyk7XG4gIHZhciBwYXJzZWQgPSBoYXNoLnJlcGxhY2UoL3NjcmVlbm5hbWUtLywgJycpO1xuICBjb25zb2xlLmxvZygnPj4+Pj4+IHVybDonLCB1cmwsIGhhc2gsIHBhcnNlZCk7XG4gIGlmICgnJyAhPT0gaGFzaCkge1xuICAgIHZhciBzY3JlZW51cmwgPSBkZWNvZGVVUklDb21wb25lbnQocGFyc2VkKTtcbiAgICB2YXIgbG9jYWwgPSAobnVsbCA9PT0gc2NyZWVudXJsLm1hdGNoKC9eaHR0cC8pKTtcbiAgICB0aGlzLl9zdG9yZS5zdWJtaXREZWZhdWx0KHNjcmVlbnVybCwgbG9jYWwpO1xuICAgIGNvbnNvbGUubG9nKCc+Pj4+IGxhdW5jaCB0aGUgbmV3IHNjcmVlbicsIHNjcmVlbnVybCk7XG4gICAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuX2NvbmZpZ0ZyYW1lKTtcbiAgICB0aGlzLmxvYWREZWZhdWx0KCk7XG4gIH1cbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLm9uT3BlbkNvbmZpZyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gIHRoaXMuX2NvbmZpZ0ZyYW1lID0gaWZyYW1lO1xuICBpZnJhbWUuc3R5bGUuekluZGV4ID0gJzE2JztcbiAgaWZyYW1lLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbmlmcmFtZS5zdHlsZS53aWR0aCA9ICcyNTBweCc7XG5pZnJhbWUuc3R5bGUuaGVpZ2h0ID0gJzM1MHB4JztcbiAgaWZyYW1lLmlkID0gJ2ZveG5vYi1jb25maWcnO1xuICBpZnJhbWUuc2V0QXR0cmlidXRlKCdtb3picm93c2VyJywgJ3RydWUnKTtcbiAgaWZyYW1lLnNldEF0dHJpYnV0ZSgncmVtb3RlJywgJ3RydWUnKTtcbiAgaWZyYW1lLnNyYyA9ICdodHRwczovL2ZveGtub2IuaGVyb2t1YXBwLmNvbS8jJztcbiAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gIGlmcmFtZS5hZGRFdmVudExpc3RlbmVyKCdtb3picm93c2VybG9jYXRpb25jaGFuZ2UnLCB0aGlzKTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLmNyZWF0ZVNjcmVlbkZyYW1lID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgaWZyYW1lLmlkID0gJ2ZveG5vYi1hY3RpdmF0ZWQtc2NyZWVuJztcbiAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnbW96YnJvd3NlcicsICd0cnVlJyk7XG4gIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ3JlbW90ZScsICd0cnVlJyk7XG4gIHJldHVybiBpZnJhbWU7XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5wcm9tcHROb0Nvbm5lY3Rpb24gPSBmdW5jdGlvbih1cmwpIHtcbiAgY29uc29sZS5lcnJvcignTm8gSW50ZXJuZXQgQ29ubmVjdGlvbiBmb3IgdGhlIFNjcmVlbjogJywgdXJsKTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLmxvYWREZWZhdWx0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciB7IHVybCwgbWFuaWZlc3QgfSA9IHRoaXMuX3N0b3JlLmZldGNoRGVmYXVsdCgnZm94bm9iLWRlZmF1bHQnKTtcbiAgdmFyIGlmcmFtZSA9IHRoaXMuY3JlYXRlU2NyZWVuRnJhbWUoKTtcbiAgY29uc29sZS5sb2coJz4+Pj4gd2FudCB0byBsb2FkIGRlZmF1bHQ6ICcsIHVybCwgbWFuaWZlc3QpO1xuICAvLyBSZW1vdGUuIE5lZWQgaW50ZXJuZXQuXG4gIGlmICghbWFuaWZlc3QpIHtcbiAgICB0aGlzLmFzc2VydENvbm5lY3Rpb24oKS50aGVuKCgpID0+IHtcbiAgICAgIGlmcmFtZS5zcmMgPSB1cmw7XG4gICAgICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICB0aGlzLnByb21wdE5vQ29ubmVjdGlvbih1cmwpO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGlmcmFtZS5zcmMgPSB1cmw7XG4gICAgdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gIH1cbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLmFzc2VydENvbm5lY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgLy8gVE9ET1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5sb2FkRHVtbXlTY3JlZW5MZWZ0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgdmFyIG9sZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhY3RpdmF0ZWQtbG9ja3NjcmVlbi1jb250ZW50Jyk7XG4gIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5yZW1vdmVDaGlsZChvbGQpO1xuICBpZnJhbWUuaWQgPSAnYWN0aXZhdGVkLWxvY2tzY3JlZW4tY29udGVudCc7XG4gIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ21vemJyb3dzZXInLCAndHJ1ZScpO1xuICBpZnJhbWUuc2V0QXR0cmlidXRlKCdyZW1vdGUnLCAndHJ1ZScpO1xuICBpZnJhbWUuc3JjID0gJ2FwcDovL2NhbGVuZGFyLmdhaWFtb2JpbGUub3JnL2luZGV4Lmh0bWwnO1xuICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLmxvYWREdW1teVNjcmVlblJpZ2h0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgdmFyIG9sZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhY3RpdmF0ZWQtbG9ja3NjcmVlbi1jb250ZW50Jyk7XG4gIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5yZW1vdmVDaGlsZChvbGQpO1xuICBpZnJhbWUuaWQgPSAnYWN0aXZhdGVkLWxvY2tzY3JlZW4tY29udGVudCc7XG4gIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ21vemJyb3dzZXInLCAndHJ1ZScpO1xuICBpZnJhbWUuc2V0QXR0cmlidXRlKCdyZW1vdGUnLCAndHJ1ZScpO1xuICBpZnJhbWUuc3JjID0gJ2FwcDovL2Nsb2NrLmdhaWFtb2JpbGUub3JnL2luZGV4Lmh0bWwnO1xuICB0aGlzLmVsZW1lbnRzLmJyb3dzZXJDb250YWluZXIuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLndhaXRMb2NrU2NyZWVuID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXNvbHZlO1xuICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChfciwgX2opID0+IHtcbiAgICByZXNvbHZlID0gX3I7XG4gIH0pO1xuICB2YXIgc29sdmVJdCA9IGZ1bmN0aW9uIHNvbHZlSXQoKSB7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2xvY2tzY3JlZW4tYXBwb3BlbmVkJywgc29sdmVJdCk7XG4gICAgcmVzb2x2ZSgpO1xuICB9O1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9ja3NjcmVlbi1hcHBvcGVuZWQnLCBzb2x2ZUl0KTtcbiAgcmV0dXJuIHByb21pc2U7XG59O1xuXG5Db250cm9sbGVyLnByb3RvdHlwZS5zZXR1cEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICBuYXZpZ2F0b3IubW96QXBwcy5tZ210LmFkZEV2ZW50TGlzdGVuZXIoJ2VuYWJsZWRzdGF0ZWNoYW5nZScsIHRoaXMpO1xuICBuYXZpZ2F0b3IubW96QXBwcy5tZ210LmFkZEV2ZW50TGlzdGVuZXIoJ3VuaW5zdGFsbCcsIHRoaXMpO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUuc2V0dXBFbGVtZW50cyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmVsZW1lbnRzLndpbmRvdyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hcHBXaW5kb3cubG9ja1NjcmVlbldpbmRvdycpO1xuICBpZiAoIXRoaXMuZWxlbWVudHMud2luZG93IHx8ICF0aGlzLmVsZW1lbnRzLndpbmRvdy5jbGFzc0xpc3QuY29udGFpbnMoJ2FjdGl2ZScpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdObyBMb2NrU2NyZWVuIHdoaWxlIHNldHRpbmcgdXAuJyk7XG4gIH1cbiAgdGhpcy5lbGVtZW50cy5mcmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsb2Nrc2NyZWVuLWZyYW1lJyk7XG4gIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lciA9IHRoaXMuZWxlbWVudHMuZnJhbWUucGFyZW50RWxlbWVudDtcbiAgdGhpcy5lbGVtZW50cy5iYWNrZ3JvdW5kID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xvY2tzY3JlZW4tYmFja2dyb3VuZCcpO1xuXG4gIHRoaXMub3JpZ2luYWxzLmJhY2tncm91bmRJbWFnZSA9IHRoaXMuZWxlbWVudHMuYmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2U7XG4gIHRoaXMub3JpZ2luYWxzLmJhY2tncm91bmRDb2xvciA9IHRoaXMuZWxlbWVudHMuYmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3I7XG4gIHRoaXMub3JpZ2luYWxzLmJyb3dzZXJDb250YWluZXJCYWNrZ3JvdW5kID0gdGhpcy5lbGVtZW50cy5icm93c2VyQ29udGFpbmVyLnN0eWxlLmJhY2tncm91bmQ7XG5cbiAgdGhpcy5lbGVtZW50cy5iYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmQgPSAnbm9uZSc7XG4gIHRoaXMuZWxlbWVudHMuYnJvd3NlckNvbnRhaW5lci5iYWNrZ3JvdW5kID0gJ25vbmUnO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUub25FbmFibGUgPSBmdW5jdGlvbigpIHtcblxufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUub25EaXNhYmxlID0gZnVuY3Rpb24oKSB7XG5cbn07XG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLm9uTGVmdExvY2tTY3JlZW4gPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJz4+Pj4gb24gbGVmdCBsb2Nrc2NyZWVuJyk7XG4gIHRoaXMubG9hZER1bW15U2NyZWVuTGVmdCgpO1xufTtcblxuQ29udHJvbGxlci5wcm90b3R5cGUub25SaWdodExvY2tTY3JlZW4gPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJz4+Pj4gb24gcmlnaHQgbG9ja3NjcmVlbicpO1xuICB0aGlzLmxvYWREdW1teVNjcmVlblJpZ2h0KCk7XG59O1xuXG4vKlxuQ29udHJvbGxlci5wcm90b3R5cGUuaGFuZGxlRXZlbnQgPSBmdW5jdGlvbihlKSB7XG4gIC8vIGRlYnVnIGF0IGFpclxuICAvLyB2YXIgTUFOSUZFU1RfVVJMID0gJ2FwcDovL2Q4ZGM2MGMwLWE3YjAtMDE0Yi04NjU5LWFlNTdjYTdmNWZjYS9tYW5pZmVzdC53ZWJhcHAnO1xuICAvLyBvbmxpbmUgdmVyc2lvblxuICB2YXIgTUFOSUZFU1RfVVJMID0gJ2h0dHBzOi8vZ3JlZy13ZW5nLmdpdGh1Yi5pby9yZXBsYWNhYmxlLWxvY2tzY3JlZW5zL21hbmlmZXN0LndlYmFwcCc7XG4gIGlmIChlLmFwcGxpY2F0aW9uLm1hbmlmZXN0VVJMICE9PSBNQU5JRkVTVF9VUkwpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBzd2l0Y2goZS50eXBlKSB7XG4gICAgY2FzZSAnZW5hYmxlZHN0YXRlY2hhbmdlJzpcbiAgICAgIGlmIChlLmFwcGxpY2F0aW9uLmVuYWJsZWQpIHtcbiAgICAgICAgdGhpcy5uZXh0KHRoaXMub25FbmFibGUuYmluZCh0aGlzKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm5leHQodGhpcy5vbkRpc2FibGUuYmluZCh0aGlzKSk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICd1bmluc3RhbGwnOlxuICAgICAgdGhpcy5uZXh0KHRoaXMub25Vbmluc3RhbGwuYmluZCh0aGlzKSk7XG4gICAgICBicmVhaztcbiAgfVxufTtcbiovXG5cbkNvbnRyb2xsZXIucHJvdG90eXBlLm9uVW5pbnN0YWxsID0gZnVuY3Rpb24oKSB7XG4gIG5hdmlnYXRvci5tb3pBcHBzLm1nbXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZW5hYmxlZHN0YXRlY2hhbmdlJywgdGhpcyk7XG4gIG5hdmlnYXRvci5tb3pBcHBzLm1nbXQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndW5pbnN0YWxsJywgdGhpcyk7XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvQ29udHJvbGxlci5qc1xuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuLyogZ2xvYmFsIEhhbW1lciAqL1xuXG5leHBvcnQgZnVuY3Rpb24gR2VzdHVyZUNvbnRyb2xsZXIoKSB7fVxuR2VzdHVyZUNvbnRyb2xsZXIucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucXVldWUgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgdGhpcy5zZXR1cENvdmVyKCk7XG4gIHZhciBoYW1tZXIgICAgPSBuZXcgSGFtbWVyLk1hbmFnZXIodGhpcy5jb3Zlcik7XG4gIHZhciBzd2lwZSAgICAgPSBuZXcgSGFtbWVyLlN3aXBlKCk7XG4gIGhhbW1lci5hZGQoc3dpcGUpO1xuICBoYW1tZXIub24oJ3N3aXBlbGVmdCcsICgpID0+IHtcbiAgICBjb25zb2xlLmxvZygnPDw8PDw8IGxlZnQnKTtcbiAgICB0aGlzLm5leHQodGhpcy5sZWZ0QmluZGVycykubmV4dCgoKSA9PiB7Y29uc29sZS5sb2coJzw8PDw8PCBhZnRlciBsZWZ0Jyk7fSk7XG4gIH0pO1xuICBoYW1tZXIub24oJ3N3aXBlcmlnaHQnLCAoKSA9PiB7XG4gICAgY29uc29sZS5sb2coJz4+Pj4+IHJpZ2h0Jyk7XG4gICAgdGhpcy5uZXh0KHRoaXMucmlnaHRCaW5kZXJzKS5uZXh0KCgpID0+IHtjb25zb2xlLmxvZygnPj4+Pj4+IGFmdGVyIHJpZ2h0Jyk7fSk7XG4gIH0pO1xuICBoYW1tZXIub24oJ3N3aXBldXAnLCAoKSA9PiB7XG4gICAgY29uc29sZS5sb2coJ15eXl5eXl4gdXAnKTtcbiAgICB0aGlzLm5leHQodGhpcy51cEJpbmRlcnMpLm5leHQoKCkgPT4ge2NvbnNvbGUubG9nKCdeXl5eXl5eXiBhZnRlciB1cCcpO30pO1xuICB9KTtcbiAgdGhpcy5sZWZ0QmluZGVycyA9IFtdO1xuICB0aGlzLnJpZ2h0QmluZGVycyA9IFtdO1xuICB0aGlzLnVwQmluZGVycyA9IFtdO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkdlc3R1cmVDb250cm9sbGVyLnByb3RvdHlwZS5zZXR1cENvdmVyID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuY292ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGhpcy5jb3Zlci5pZCA9ICdmb3hub2ItY292ZXInO1xuICB0aGlzLmNvdmVyLnN0eWxlLmJhY2tncm91bmQgPSAncmdiYSgwLCAxMDAsIDAsIDAuMSknO1xuICB0aGlzLmNvdmVyLnN0eWxlLndpZHRoID0gICcxMDAlJztcbiAgdGhpcy5jb3Zlci5zdHlsZS5oZWlnaHQgPSAnODAlJztcbiAgdGhpcy5jb3Zlci5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gIHRoaXMuY292ZXIuc3R5bGUudG9wID0gJzQwcHgnO1xuICB0aGlzLmNvdmVyLnN0eWxlLnpJbmRleCA9ICc4Jztcbn07XG5cbkdlc3R1cmVDb250cm9sbGVyLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24oc3RlcHMpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KHN0ZXBzKSkge1xuICAgIHN0ZXBzID0gW3N0ZXBzXTtcbiAgfVxuICB2YXIgc3RlcFByb21pc2VzID0gc3RlcHMubWFwKChzdGVwKSA9PiB7XG4gICAgcmV0dXJuIHN0ZXAoKTtcbiAgfSk7XG4gIHRoaXMucXVldWUgPSB0aGlzLnF1ZXVlLnRoZW4oKCkgPT4ge1xuICAgIHJldHVybiBQcm9taXNlLmFsbChzdGVwUHJvbWlzZXMpO1xuICB9KS5jYXRjaChjb25zb2xlLmVycm9yLmJpbmQoY29uc29sZSkpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkdlc3R1cmVDb250cm9sbGVyLnByb3RvdHlwZS5iaW5kT25MZWZ0ID0gZnVuY3Rpb24oY2IpIHtcbiAgdGhpcy5sZWZ0QmluZGVycy5wdXNoKGNiKTtcbn07XG5cbkdlc3R1cmVDb250cm9sbGVyLnByb3RvdHlwZS5iaW5kT25SaWdodCA9IGZ1bmN0aW9uKGNiKSB7XG4gIHRoaXMucmlnaHRCaW5kZXJzLnB1c2goY2IpO1xufTtcblxuR2VzdHVyZUNvbnRyb2xsZXIucHJvdG90eXBlLmJpbmRPblVwID0gZnVuY3Rpb24oY2IpIHtcbiAgdGhpcy51cEJpbmRlcnMucHVzaChjYik7XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvR2VzdHVyZUNvbnRyb2xsZXIuanNcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBTdG9yZSgpIHt9XG5TdG9yZS5wcm90b3R5cGUuZmV0Y2hEZWZhdWx0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdmb3hub2ItZGVmYXVsdCcpKTtcbn07XG5cblN0b3JlLnByb3RvdHlwZS5zdWJtaXREZWZhdWx0ID0gZnVuY3Rpb24odXJsLCBsb2NhbCkge1xuICB2YXIgbWFuaWZlc3RVcmw7XG4gIGlmIChsb2NhbCkge1xuICAgIHZhciBuYW1lID0gdXJsO1xuICAgIC8vdXJsID0gd2luZG93LnBhcmVudC5sb2NhdGlvbi5ocmVmLnJlcGxhY2UoJ3N5c3RlbScsIG5hbWUpO1xuICAgIHVybCA9IHdpbmRvdy5wYXJlbnQubG9jYXRpb24uaHJlZi5yZXBsYWNlKHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSwgbmFtZSk7XG4gICAgbWFuaWZlc3RVcmwgPSB1cmwucmVwbGFjZSgvKFxcLykqKGluZGV4Lmh0bWwjPykqJC8sICcvbWFuaWZlc3Qud2ViYXBwJyk7XG4gICAgdXJsICs9ICcjc2VjdXJlJztcbiAgfVxuICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnZm94bm9iLWRlZmF1bHQnLFxuICAgIEpTT04uc3RyaW5naWZ5KHsgJ3VybCc6IHVybCwgJ21hbmlmZXN0JzogbWFuaWZlc3RVcmwgfSkpO1xufTtcblxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvU3RvcmUuanNcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9