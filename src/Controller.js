'use strict';
import { GestureController } from 'src/GestureController.js';
import { Store } from 'src/Store.js';
export function Controller() {}
Controller.prototype.start = function() {
  this.SCREEN_TIMEOUT = 30;
  this._retryTime = 0;
  this._retryMax = 15;
  this._errorCover = null;
  this._waitingTimer = null;
  this._store = new Store();
  this._configFrame = null;
  this._waitingCover = null;
  this._contentFrame = null;
  this._appInstallZIndex = 1024;
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
    .then(this.setupEvents.bind(this)).then(this.label.bind(this, '>>> launching'))
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
      } else if(null !== commandParsed) {
        this.next(this.onConfigCommand.bind(this, commandParsed[1]));
      } else if (null !== installParsed) {
        this.next(this.onInstall.bind(this, installParsed[1]));
      } else {  // loaded.
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

Controller.prototype.onConfigCommand = function(command) {
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

Controller.prototype.removeConfigFrame = function() {
  if (null !== this._configFrame) {
    this.elements.browserContainer.removeChild(this._configFrame);
    this._configFrame = null;
  }
};

Controller.prototype.removeContentFrame = function() {
  if (null !== this._contentFrame) {
    this.elements.browserContainer.removeChild(this._contentFrame);
    this._contentFrame = null;
  }
};

Controller.prototype.resetStatusbar = function() {
  document.querySelector('#statusbar').style.display = 'block';
};

Controller.prototype.onReset = function() {
  console.log('>>>>>> reset start');
  this.removeContentFrame();
  this.removeConfigFrame();
  this.resetStatusbar();
  console.log('>>>>>> reset stopped');
};

Controller.prototype.onInstall = function(strprogress) {
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

Controller.prototype.tryDelayInvoke = function(name) {
  console.log('>>>>>>> try delay invoke');
  this.invokeInstalled(name).then(() => {
    console.log('>>>>>> progress delay invoke done: name: ', name);
    this._retryTime = 0;
  }).catch((err) => {
    if (this._retryTime > this._retryMax) {
      throw new Error('Can\'t invoke the app ' + name +
        ' after ' + this._retryMax + ' times');
    }
    this._retryTime += 1;
    setTimeout(() => {
      // XXX: can't invoke an app just after install it (~3 or 5 seconds).
      // I suspect it's a bug but I don't have better way to do that.
      console.error('Retry due to: ', err);
      this.tryDelayInvoke(name);
    }, 200);
  });
};

Controller.prototype.next = function(steps) {
  if (!Array.isArray(steps)) {
    steps = [steps];
  }
  var stepPromises = steps.map((step) => {
    return step();
  });
  this.queue = this.queue.then(() => {
    return Promise.all(stepPromises).catch((err) => {
      console.error('>>>> Error in inner steps', err);
      throw err;
    });
  }).catch((err) => {
    console.error('>>>> catch error in next', err);
    throw err;
  });
  return this;
};

Controller.prototype.onConfigOpened = function() {
  if (this._waitingTimer) {
    clearTimeout(this._waitingTimer);
  }
};

Controller.prototype.invokeInstalled = function(name) {
  console.log('>>>>>> try to invoke: ', name);
  return this.fromNameToInstalled(name)
    .then((appinfo) => {
      if (appinfo) {
        this._store.submitDefault(name, true, appinfo);
        if (this._configFrame) {
          this.elements.browserContainer.removeChild(this._configFrame);
          this._configFrame = null;
        }
        if (this._contentFrame) {
          this.elements.browserContainer.removeChild(this._contentFrame);
          this._contentFrame = null;
        }
        this.loadDefault();
      } else {
        throw new Error('No such content: ', name);
      }
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

Controller.prototype.onScreenChange = function(parsed) {
  var screenurl = decodeURIComponent(parsed);
  var local = (null === screenurl.match(/^http/));
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

Controller.prototype.onWaintingScreenTimeout = function() {
  // TODO: show failure and remove the message and cover.
};

Controller.prototype.showWaitingCover = function() {
  return Promise.resolve().then(() => {
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
    this._waitingCover = cover;
    this.elements.browserContainer.appendChild(cover);
  });
};

Controller.prototype.removeWaitingCover = function() {
  return Promise.resolve().then(() => {
    this.elements.browserContainer.removeChild(this._waitingCover);
    this._waitingCover = null;
  });
};

Controller.prototype.onOpenConfig = function() {
  console.log('>>>>>>>>> onOpenConfig');
  var url = 'https://foxknob.herokuapp.com/#';
  this.next(() => {
    return this.assertConnection().then((result) => {
      console.log('>>>>>>> assert connection successed', result);
    }).catch((err) => {
      console.log('>>>>>> onOpenConfig in connection error');
      this.promptNoConnection(url);
      throw err;
    });
  })
  .next(this.showWaitingCover.bind(this))
  .next(() => {
    return Promise.resolve().then(() => {
      console.log('>>>>> open config create frame', this._configFrame);
      if (this._configFrame) {
        // Remove the old config frame.
        this.elements.browserContainer.removeChild(this._configFrame);
        this._configFrame = null;
      }
      this._waitingTimer =
        setTimeout(this.onWaintingScreenTimeout, this.SCREEN_TIMEOUT);
      console.log('>>>>> set timeout');
      var iframe = this.createScreenFrame();
      iframe.classList.add('foxnob-config');
      iframe.style.zIndex = '65535';
      iframe.src = url;
      document.querySelector('#statusbar').style.display = 'none';
      this._configFrame = iframe;
      console.log('>>>>> append');
      this.elements.browserContainer.appendChild(iframe);
      console.log('>>>>>> add event listener location now');
      iframe.addEventListener('mozbrowserlocationchange', this);
      console.log('>>>>> done');
    });
  });
};

Controller.prototype.createScreenFrame = function() {
  var iframe = document.createElement('iframe');
  iframe.id = 'foxnob-activated-screen';
  iframe.setAttribute('mozbrowser', 'true');
  iframe.setAttribute('remote', 'true');
  iframe.style.position = 'fixed';
  return iframe;
};

Controller.prototype.promptNoConnection = function(url) {
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
      this._contentFrame = iframe;
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
    this._contentFrame = iframe;
    this.elements.browserContainer.appendChild(iframe);
  }
};

Controller.prototype.fromNameToInstalled = function(name) {
  return navigator.mozApps.mgmt.getAll()
    .then((apps) => {
      return apps.filter((app) => {
        if (app.manifest) {
          return (name === app.manifest.name);
        } else {
          return false;
        }
      })[0];
    });
};

Controller.prototype.assertConnection = function() {
  var lock = navigator.mozSettings.createLock();
  var wifi = lock.get('wifi.enabled').then((r) => { return r['wifi.enabled'];});
  var rildata = lock.get('ril.data.enabled').then((r) => { return r['ril.data.enabled'];});
  return Promise.all([wifi, rildata]).then((rs) => {
    if (rs[0] || rs[1]) {
      return true;
    } else {
      console.error('No connection: ', rs[0], rs[1]);
      throw new Error('No connection: ');
    }
  });
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
  //navigator.mozApps.mgmt.addEventListener('enabledstatechange', this);
  //navigator.mozApps.mgmt.addEventListener('uninstall', this);
  window.addEventListener('click', this);
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
