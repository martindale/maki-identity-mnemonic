importScripts('/js/fullnode.min.js');

self.onmessage.addEventListener('message', function(e) {
  e.source.postMessage('Hello! Your message was: ' + e.data);
});

self.addEventListener('fetch', function(event) {
  console.log('fetching!');
  console.log('event:', event);

  var phrase = fullnode.BIP39.en().fromRandom();
  var keypair = fullnode.BIP32().fromSeed(phrase.toSeed());

  // TODO: determine reasonable keypath strategy
  var child = keypair.derive('m/0\'');
  var pubkey = child.pubkey

  console.log('pubkey:', pubkey);

  return fetch(event.request, {
    headers: {
      'x-identity': pubkey.toString()
    }
  });
});
