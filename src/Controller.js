'use strict';
import { GestureController } from 'src/GestureController.js';
export function Controller() {}
Controller.prototype.start = function() {
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
//    .then(this.setupEvents.bind(this)).then(this.label.bind(this, '>>> launching'))
//    .then(this.waitLockScreen.bind(this)).then(this.label.bind(this, '>>> wait lockscreen done'))
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

Controller.prototype.onOpenConfig = function() {
  var iframe = document.createElement('iframe');
  iframe.style.zIndex = '16';
  iframe.style.position = 'relative';
  iframe.id = 'replacable-config';
  iframe.setAttribute('mozbrowser', 'true');
  iframe.setAttribute('remote', 'true');
  iframe.src = 'https://foxknob.herokuapp.com/';
  this.elements.browserContainer.appendChild(iframe);
  iframe.addEventListener('mozbrowserlocationchange', function(evt) {
    var url = evt.detail;
    var hash = url.replace(/^.*#/, '');
    console.log('>>>>>> url:', url, hash);
    this.elements.browserContainer.removeChild(iframe);
  });
};

Controller.prototype.loadDefault = function() {
  var iframe = document.createElement('iframe');
  iframe.id = 'activated-lockscreen-content';
  iframe.setAttribute('mozbrowser', 'true');
  iframe.setAttribute('remote', 'true');
  iframe.src = 'https://www.google.com';
  this.elements.browserContainer.appendChild(iframe);
  //iframe.src = 'app://music.gaiamobile.org/manifest.webapp';
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

Controller.prototype.onUninstall = function() {
  navigator.mozApps.mgmt.removeEventListener('enabledstatechange', this);
  navigator.mozApps.mgmt.removeEventListener('uninstall', this);
};
