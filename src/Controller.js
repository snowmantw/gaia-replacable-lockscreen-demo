'use strict';
import { GestureController } from 'src/GestureController.js';
import { Store } from 'src/Store.js';
export function Controller() {}
Controller.prototype.start = function() {
  this.SCREEN_TIMEOUT = 30;
  this._waitingTimer = null;
  this._store = new Store();
  this._configFrame = null;
  console.log('>>>> try to launch addon');
  // TODO: 1. if we have settings to know how many LSW could be injected,
  //          read it here.
  //       2. some dummy function need to be filled later.
  this.queue = new Promise((resolve, reject) => {
      this.elements = {};
      this.originals = {};
      // TODO: should read config here
      resolve();
    })
//    .then(this.setupEvents.bind(this)).then(this.label.bind(this, '>>> launching'))
    .then(this.waitLockScreen.bind(this)).then(this.label.bind(this, '>>> wait lockscreen done'))
    .then(this.setupElements.bind(this)).then(this.label.bind(this, '>>> set elements done'))
    .then(this.setupGesture.bind(this)).then(this.label.bind(this, '>>> set gesture done'))
//    .then(this.loadDefault.bind(this)).then(this.label.bind(this, '>>> load default one'))
    .catch(this.onMainPromiseError.bind(this));
};

Controller.prototype.label = function(lb) {
  console.log(lb);
};

Controller.prototype.onMainPromiseError = function(err) {
  console.error('>>> Controller Error: ', err);
};

Controller.prototype.setupGesture = function() {
  this._gestureController = new GestureController();
  return new Promise((resolve, reject) => {
    this._gestureController.start()
    .next(() => {
      console.log('>>>> bind gesture in Controller');
      this._gestureController.bindOnLeft(this.onLeftLockScreen.bind(this));
      this._gestureController.bindOnRight(this.onRightLockScreen.bind(this));
      this._gestureController.bindOnUp(this.onOpenConfig.bind(this));
      this.elements.browserContainer.appendChild(this._gestureController.cover);
    })
    .next(() => {
      console.log('>>>> ending gesture setup in Controller');
      resolve();
    });
  });
};

Controller.prototype.handleEvent = function(evt) {
  switch (evt.type) {
    case 'mozbrowserlocationchange':
      // TODO: can preview the UI before apply that:
      // add a field in the hash.
      console.log('>>>>>>> locationchanged', evt);
      var url = evt.detail;
      var hash = url.replace(/^.*#/, '');
      var parsed = hash.replace(/screenname-/, '');
      console.log('>>>>>> url:', url, hash, parsed);
      if ('' !== parsed) {
        this.next(this.onScreenChange.bind(this, parsed));
      } else {
        this.next(this.onConfigOpened.bind(this));
      }
      break;
  }
};


Controller.prototype.next = function(steps) {
  if (!Array.isArray(steps)) {
    steps = [steps];
  }
  var stepPromises = steps.map((step) => {
    return step();
  });
  this.queue = this.queue.then(() => {
    return Promise.all(stepPromises).catch(console.error.bind(console));
  }).catch(console.error.bind(console));
  return this;
};

Controller.prototype.onConfigOpened = function() {
  if (this._waitingTimer) {
    clearTimeout(this._waitingTimer);
  }
};

Controller.prototype.onScreenChange = function(parsed) {
  var screenurl = decodeURIComponent(parsed);
  var local = (null === screenurl.match(/^http/));
  console.log('>>>>> onScreenChange: ', parsed, local, screenurl);
  if (local) {
    var name = screenurl;
    this.fromNameToInstalled(name)
      .then((appinfo) => {
        if (appinfo) {
          this._store.submitDefault(name, local, appinfo);
          this.elements.browserContainer.removeChild(this._configFrame);
          this.loadDefault();
        } else {
          console.error('No such content: ', screenurl);
        }
      });
  } else {
    this._store.submitDefault(screenurl, local);
    this.elements.browserContainer.removeChild(this._configFrame);
    this.loadDefault();
  }
};

Controller.prototype.onWaintingScreenTimeout = function() {
  // TODO: show failure and remove the message and cover.
};

Controller.prototype.showWaitingCover = function() {
  console.log('>>>>>> showWaitingCover');
};

Controller.prototype.onOpenConfig = function() {
  console.log('>>>>>>>>> onOpenConfig');
  var url = 'https://foxknob.herokuapp.com/#';
  this.next(this.showWaitingCover.bind(this))
      .next(() => {
        console.log('>>>>>> assertConnection');
        return this.assertConnection().catch(() => {
          this.promptNoConnection(url);
        });
      })
      .next(() => {
        console.log('>>>>> open config create frame');
        this._waitingTimer =
          setTimeout(this.onWaintingScreenTimeout, this.SCREEN_TIMEOUT);
        var iframe = this.createScreenFrame();
        iframe.classList.add('foxnob-config');
        iframe.style.zIndex = '65535';
        iframe.src = url;
        this._configFrame = iframe;
        this.elements.browserContainer.appendChild(iframe);
        iframe.addEventListener('mozbrowserlocationchange', this);
      });
};

Controller.prototype.createScreenFrame = function() {
  var iframe = document.createElement('iframe');
  iframe.id = 'foxnob-activated-screen';
  iframe.setAttribute('mozbrowser', 'true');
  iframe.setAttribute('remote', 'true');
  iframe.style.position = 'relative';
  return iframe;
};

Controller.prototype.promptNoConnection = function(url) {
  console.error('No Internet Connection for the Screen: ', url);
};

Controller.prototype.loadDefault = function() {
  var { url, manifest } = this._store.fetchDefault('foxnob-default');
  var iframe = this.createScreenFrame();
  console.log('>>>> want to load default: ', url, manifest);
  // Remote. Need internet.
  if (!manifest) {
    this.assertConnection().then(() => {
      console.log('>>> no manifest');
      iframe.style.zIndex = '1';
      iframe.style.background = 'black';
      iframe.setAttribute('src', url);
      this.elements.browserContainer.appendChild(iframe);
    }).catch(() => {
      this.promptNoConnection(url);
    });
  } else {
    console.log('>>> with manifest');
    iframe.setAttribute('src', url);
    iframe.setAttribute('mozapp', manifest);
    iframe.style.background = 'black';
    iframe.style.zIndex = '1';
    this.elements.browserContainer.appendChild(iframe);
  }
};

Controller.prototype.fromNameToInstalled = function(name) {
  return navigator.mozApps.mgmt.getAll()
    .then((apps) => {
      return apps.filter((app) => {
        return (name === app.manifest.name);
      })[0];
    });
};

Controller.prototype.assertConnection = function() {
  // TODO
  return Promise.resolve();
};

Controller.prototype.loadDummyScreenLeft = function() {
  var iframe = document.createElement('iframe');
  var old = document.querySelector('#activated-lockscreen-content');
  this.elements.browserContainer.removeChild(old);
  iframe.id = 'activated-lockscreen-content';
  iframe.setAttribute('mozbrowser', 'true');
  iframe.setAttribute('remote', 'true');
  iframe.src = 'app://calendar.gaiamobile.org/index.html';
  this.elements.browserContainer.appendChild(iframe);
};

Controller.prototype.loadDummyScreenRight = function() {
  var iframe = document.createElement('iframe');
  var old = document.querySelector('#activated-lockscreen-content');
  this.elements.browserContainer.removeChild(old);
  iframe.id = 'activated-lockscreen-content';
  iframe.setAttribute('mozbrowser', 'true');
  iframe.setAttribute('remote', 'true');
  iframe.src = 'app://clock.gaiamobile.org/index.html';
  this.elements.browserContainer.appendChild(iframe);
};

Controller.prototype.waitLockScreen = function() {
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

Controller.prototype.setupEvents = function() {
  navigator.mozApps.mgmt.addEventListener('enabledstatechange', this);
  navigator.mozApps.mgmt.addEventListener('uninstall', this);
};

Controller.prototype.setupElements = function() {
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

Controller.prototype.onEnable = function() {

};

Controller.prototype.onDisable = function() {

};

Controller.prototype.onLeftLockScreen = function() {
  console.log('>>>> on left lockscreen');
  this.loadDummyScreenLeft();
};

Controller.prototype.onRightLockScreen = function() {
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

Controller.prototype.onUninstall = function() {
  navigator.mozApps.mgmt.removeEventListener('enabledstatechange', this);
  navigator.mozApps.mgmt.removeEventListener('uninstall', this);
};
