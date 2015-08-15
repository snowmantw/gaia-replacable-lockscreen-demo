'use strict';

export function Store() {}
Store.prototype.fetchDefault = function() {
  return JSON.parse(localStorage.getItem('foxnob-default'));
};

Store.prototype.submitDefault = function(url, local, payload) {
  if (local) {
    url = payload.origin;
    localStorage.setItem('foxnob-default',
      JSON.stringify({ 'url': payload.origin + '/' +
                              payload.manifest.launch_path + '#secure',
                     'manifest': payload.manifestURL }));
    console.log('>>>>>>> submitlocaldefault: ', localStorage.getItem('foxnob-default'));
  } else {
    localStorage.setItem('foxnob-default',
      JSON.stringify({ 'url': url, 'manifest': null}));
  }
};

