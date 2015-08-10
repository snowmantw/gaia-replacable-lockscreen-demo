'use strict';

/* global Hammer */

export function GestureController() {}
GestureController.prototype.start = function() {
  this.queue = Promise.resolve();
  this.setupCover();
  var hammer    = new Hammer.Manager(this.cover);
  var swipe     = new Hammer.Swipe();
  hammer.add(swipe);
  hammer.on('swipeleft', () => {
    console.log('<<<<<< left');
    this.next(this.leftBinders).next(() => {console.log('<<<<<< after left');});
  });
  hammer.on('swiperight', () => {
    console.log('>>>>> right');
    this.next(this.rightBinders).next(() => {console.log('>>>>>> after right');});
  });
  hammer.on('swipeup', () => {
    console.log('^^^^^^^ up');
    this.next(this.upBinders).next(() => {console.log('^^^^^^^^ after up');});
  });
  this.leftBinders = [];
  this.rightBinders = [];
  this.upBinders = [];
  return this;
};

GestureController.prototype.setupCover = function() {
  this.cover = document.createElement('div');
  this.cover.id = 'foxnob-cover';
  this.cover.style.background = 'rgba(0, 100, 0, 0.1)';
  this.cover.style.width =  '100%';
  this.cover.style.height = '80%';
  this.cover.style.position = 'fixed';
  this.cover.style.top = '40px';
  this.cover.style.zIndex = '8';
};

GestureController.prototype.next = function(steps) {
  if (!Array.isArray(steps)) {
    steps = [steps];
  }
  var stepPromises = steps.map((step) => {
    return step();
  });
  this.queue = this.queue.then(() => {
    return Promise.all(stepPromises);
  }).catch(console.error.bind(console));
  return this;
};

GestureController.prototype.bindOnLeft = function(cb) {
  this.leftBinders.push(cb);
};

GestureController.prototype.bindOnRight = function(cb) {
  this.rightBinders.push(cb);
};

GestureController.prototype.bindOnUp = function(cb) {
  this.upBinders.push(cb);
};
