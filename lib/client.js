addEvent(window, 'load', function() {
  console.log('window loaded');
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service.js').then(function(registration) {

  });
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
