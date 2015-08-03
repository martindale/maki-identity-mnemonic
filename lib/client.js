addEvent(window, 'load', function() {
  console.log('window loaded');
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service.js').then(function(registration) {
    sendMessage({
      method: 'supplyPassphrase',
      data: prompt('passphrase')
    });
  });

  function sendMessage(message) {
    return new Promise(function(resolve, reject) {
      // note that this is the ServiceWorker.postMessage version
      navigator.serviceWorker.controller.postMessage(message);
      window.serviceWorker.onMessage = function(e) {
        resolve(e.data);
      });
    });
  }
}

function addEvent(el, eventType, handler) {
  if (el.addEventListener) { // DOM Level 2 browsers
    el.addEventListener(eventType, handler, false);
  } else if (el.attachEvent) { // IE <= 8
    el.attachEvent('on' + eventType, handler);
  } else { // ancient browsers
    el['on' + eventType] = handler;
  }
}
