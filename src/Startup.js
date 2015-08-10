'use strict';
import { Controller } from 'src/Controller.js';
(function () {
  document.addEventListener('readystatechange', function readyStateChange() {
    console.log('>>>>>>>> in addon');
    var foxnob= new Controller();
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
