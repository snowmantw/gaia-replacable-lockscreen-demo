'use strict';
(function() {
  // debug at air
  // var MANIFEST_URL = 'app://d8dc60c0-a7b0-014b-8659-ae57ca7f5fca/manifest.webapp';
  // online version
  var MANIFEST_URL = 'https://greg-weng.github.io/replacable-lockscreens/manifest.webapp';

  function GestureController() {}
  GestureController.prototype.start = function() {
    this._onLeft;
    this._onRight;
    // in px.
    this.threshold = 30;
    this.states = {
      touchStartX: 0,
      touchEndX: 0
    };
    this.touches = null;
    this.cover = document.createElement('div');
    this.cover.id = 'replacable-lockscreen-gesture-cover';
    this.cover.style.background = 'rgba(0, 100, 0, 0.1)';
    this.cover.style.width =  '100%';
    this.cover.style.height = '80%';
    this.cover.style.position = 'fixed';
    this.cover.style.top = '40px';
    this.cover.style.zIndex = '8';
    console.log('>>> >>> start gesture control');
    this.mainPromise = Promise.resolve()
      .then(this.setupCover.bind(this))
      .then(() => { console.log('>>>>>> gesture control cover activated'); })
      .catch(this.onError.bind(this));
    return this.mainPromise;
  };

  GestureController.prototype.setOnLeft = function(cb) {
    console.log('>>>> set on left');
    this._onLeft = cb;
  };

  GestureController.prototype.setOnRight = function(cb) {
    console.log('>>>> set on right');
    this._onRight = cb;
  };

  GestureController.prototype.onError = function(err) {
    console.error('>>> GestureController Error: ', err);
  };

  GestureController.prototype.setupCover = function() {
    window.addEventListener('touchstart', this);
  };

  GestureController.prototype.handleEvent = function(evt) {
    if (evt.originalTarget !== this.cover) {
      console.log('>>>>> touch but not cover');
      return;
    }
    switch (evt.type) {
      case 'touchstart':
        console.log('>>>>>>> touch start on cover');
        if (evt.touches.length === 2 && !this._touchMoving) {
          console.log('>>>>>>> double fingers touch started', evt.touches[0].pageX);
          this.states.touchStartX = evt.touches[0].pageX;

          window.addEventListener('touchmove', this);
          window.addEventListener('touchend', this);
          window.removeEventListener('touchstart', this);
          this._touchMoving = true;
        }
        break;
      case 'touchmove':
        this.states.touchEndX = evt.touches[0].pageX;
        break;
      case 'touchend':
        this._touchMoving = false;
        var delta = this.states.touchEndX - this.states.touchStartX;
        if ( Math.abs(delta) > this.threshold && delta < 0) {
          // Left
          this.mainPromise = this.mainPromise.then(this.onLeft.bind(this));
        } else if (Math.abs(delta) > this.threshold && delta > 0){
          // Right
          this.mainPromise = this.mainPromise.then(this.onRight.bind(this));
        } else {
          console.log('>>> XX: no left or right moving', delta, this.states.touchEndX, this.states.touchStartX);
        }

        this.states.touchStartX = 0;
        this.states.touchEndX = 0;
        window.addEventListener('touchstart', this);
        window.removeEventListener('touchmove', this);
        window.removeEventListener('touchend', this);
        break;
    }
  };

  GestureController.prototype.onLeft = function() {
    console.log('>>> gesture left fired');
    this.cover.addEventListener('touchstart', this);
    this.cover.removeEventListener('touchmove', this);
    this.cover.removeEventListener('touchend', this);
    this.mainPromise = this.mainPromise.then(this._onLeft);
  };

  GestureController.prototype.onRight = function() {
    console.log('>>> gesture right fired');
    this.cover.addEventListener('touchstart', this);
    this.cover.removeEventListener('touchmove', this);
    this.cover.removeEventListener('touchend', this);
    this.mainPromise = this.mainPromise.then(this._onRight);
  };

  function ReplacableLockScreen() {}
  ReplacableLockScreen.prototype.start = function() {
    console.log('>>>> try to launch addon');
    // TODO: 1. if we have settings to know how many LSW could be injected,
    //          read it here.
    //       2. some dummy function need to be filled later.
    this.mainPromise = new Promise((resolve, reject) => {
        this.elements = {};
        this.originals = {};
        // TODO: should read config here
        resolve();
      })
      .then(this.setupEvents.bind(this)).then(this.label('>>> launching'))
      .then(this.waitLockScreen.bind(this)).then(this.label('>>> wait lockscreen done'))
      .then(this.setupElements.bind(this)).then(this.label('>>> set elements done'))
      .then(this.setupGesture.bind(this)).then(this.label('>>> set gesture done'))
      .then(this.loadDefault.bind(this)).then(this.label('>>> load default one'))
      .catch(this.onMainPromiseError.bind(this));
  };

  ReplacableLockScreen.prototype.label = function(lb) {
    console.log(lb);
  };

  ReplacableLockScreen.prototype.onMainPromiseError = function(err) {
    console.error('>>> ReplacableLockScreen Error: ', err);
  };

  ReplacableLockScreen.prototype.setupGesture = function() {
    console.log('>>>>>> setup gesture now');
    this._gestureController = new GestureController();
    console.log('>>>>>> Done to setup gesture');
    return this._gestureController.start()
      .then(() => {
        this._gestureController.setOnLeft(this.onLeftLockScreen.bind(this));
        this._gestureController.setOnRight(this.onRightLockScreen.bind(this));
        this.elements.browserContainer.appendChild(this._gestureController.cover);
      })
      .catch(this.onMainPromiseError.bind(this));
  };

  ReplacableLockScreen.prototype.loadDefault = function() {
    var iframe = document.createElement('iframe');
    iframe.id = 'activated-lockscreen-content';
    iframe.setAttribute('mozbrowser', 'true');
    iframe.setAttribute('remote', 'true');
    iframe.src = 'https://www.google.com';
    this.elements.browserContainer.appendChild(iframe);
    //iframe.src = 'app://music.gaiamobile.org/manifest.webapp';
  };

  ReplacableLockScreen.prototype.loadDummyScreenLeft = function() {
    var iframe = document.createElement('iframe');
    var old = document.querySelector('#activated-lockscreen-content');
    this.elements.browserContainer.removeChild(old);
    iframe.id = 'activated-lockscreen-content';
    iframe.setAttribute('mozbrowser', 'true');
    iframe.setAttribute('remote', 'true');
    iframe.src = 'app://calendar.gaiamobile.org/index.html';
    this.elements.browserContainer.appendChild(iframe);
  };

  ReplacableLockScreen.prototype.loadDummyScreenRight = function() {
    var iframe = document.createElement('iframe');
    var old = document.querySelector('#activated-lockscreen-content');
    this.elements.browserContainer.removeChild(old);
    iframe.id = 'activated-lockscreen-content';
    iframe.setAttribute('mozbrowser', 'true');
    iframe.setAttribute('remote', 'true');
    iframe.src = 'app://clock.gaiamobile.org/index.html';
    this.elements.browserContainer.appendChild(iframe);
  };

  ReplacableLockScreen.prototype.waitLockScreen = function() {
    var resolve;
    var promise = new Promise((_r, _j) => {
      resolve = _r;
    });
    var solveIt = function solveIt() {
      window.removeEventListener('lockscreen-appopened', solveIt);
      resolve();
    };
    window.addEventListener('lockscreen-appopened', solveIt);
    return promise;
  };

  ReplacableLockScreen.prototype.setupEvents = function() {
    navigator.mozApps.mgmt.addEventListener('enabledstatechange', this);
    navigator.mozApps.mgmt.addEventListener('uninstall', this);
  };

  ReplacableLockScreen.prototype.setupElements = function() {
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

  ReplacableLockScreen.prototype.onEnable = function() {
  
  };

  ReplacableLockScreen.prototype.onDisable = function() {
  
  };

  ReplacableLockScreen.prototype.onLeftLockScreen = function() {
    console.log('>>>> on left lockscreen');
    this.loadDummyScreenLeft();
  };

  ReplacableLockScreen.prototype.onRightLockScreen = function() {
    console.log('>>>> on right lockscreen');
    this.loadDummyScreenRight();
  };

  ReplacableLockScreen.prototype.handleEvent = function(e) {
    if (e.application.manifestURL !== MANIFEST_URL) {
      return;
    }

    switch(e.type) {
      case 'enabledstatechange':
        if (e.application.enabled) {
          this.mainPromise = this.mainPromise.then(this.onEnable.bind(this));
        } else {
          this.mainPromise = this.mainPromise.then(this.onDisable.bind(this));
        }
        break;
      case 'uninstall':
        this.mainPromise = this.mainPromise.then(this.onUninstall.bind(this));
        break;
    }
  };

  ReplacableLockScreen.prototype.onUninstall = function() {
    navigator.mozApps.mgmt.removeEventListener('enabledstatechange', this);
    navigator.mozApps.mgmt.removeEventListener('uninstall', this);
  };

  document.addEventListener('readystatechange',
    function readyStateChange() {
      console.log('>>>>>>>> in addon');
      if (document.readyState === 'interactive') {
        document.removeEventListener('readystatechange',
          readyStateChange);
        var replacableLockScreen = new ReplacableLockScreen();
        replacableLockScreen.start();
      }
    });
})();
