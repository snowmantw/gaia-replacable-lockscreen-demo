'use strict';

export function Store() {}
Store.prototype.fetchDefault = function() {
  return JSON.parse(localStorage.getItem('foxnob-default'));
};

Store.prototype.submitDefault = function(url, local) {
  var manifestUrl;
  if (local) {
    var name = url;
    //url = window.parent.location.href.replace('system', name);
    url = window.parent.location.href.replace(window.location.hostname, name);
    manifestUrl = url.replace(/(\/)*(index.html#?)*$/, '/manifest.webapp');
    url += '#secure';
  }
  localStorage.setItem('foxnob-default',
    JSON.stringify({ 'url': url, 'manifest': manifestUrl }));
};

