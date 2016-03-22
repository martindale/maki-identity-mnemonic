importScripts('/assets/bitcore-lib.js');
importScripts('/assets/bitcore-mnemonic.js');
importScripts('/assets/bitcore-message.js');

function Datastore() {

}
Datastore.prototype._store = function(obj, cb) {
  var self = this;
  var transaction = self.db.transaction(['keys'], 'readwrite');
  var objectStore = transaction.objectStore('keys');
  var request = objectStore.add(obj);
  request.onsuccess = function(event) {
    cb(null, event);
  };
};
Datastore.prototype._get = function(key, cb) {
  var self = this;
  var transaction = self.db.transaction(['keys'], 'readonly');
  var objectStore = transaction.objectStore('keys');
  var query = objectStore.get(key);
  query.onsuccess = function(event) {
    cb(null, objectStore.result);
  };
};
Datastore.prototype._getAll = function(name, cb) {
  var self = this;
  var transaction = self.db.transaction([name], 'readonly');
  var objectStore = transaction.objectStore(name);
  var items = [];

  transaction.oncomplete = function(event) {
    cb(null, items);
  };

  var query = objectStore.openCursor();
  query.onerror = function(error) {
    console.error(error);
  };
  query.onsuccess = function(event) {
    var cursor = event.target.result;
    if (cursor) {
      items.push(cursor.value);
      cursor.continue();
    }
  };
};
Datastore.prototype._connect = function(cb) {
  var me = this;
  me.request = indexedDB.open('fabric-identity', 1);
  me.request.onerror = function(event) {
    console.error('[MAKI:SERVICE-WORKER]', 'db.onerror', event);
  };
  me.request.onupgradeneeded = function(event) {
    var db = event.target.result;
    var objectStore = db.createObjectStore('keys');
    objectStore.createIndex('public', 'public', { unique: true });
  };
  me.request.onsuccess = function(event) {
    me.db = event.target.result;
    cb();
  };
};

self.db = new Datastore();
self.db._connect(function() {
  console.log('[MAKI:SERVICE-WORKER]', 'connected.');
});

self.addEventListener('message', function(e) {
  //e.source.postMessage('Hello! Your message was: ' + e.data);
  console.log('[MAKI:SERVICE-WORKER]', 'message', e.data);

  var msg = e.data;
  switch (e.data.type) {
    case '_lock':
      console.log('[MAKI:SERVICE-WORKER]', '_lock');
      break;
    case '_unlock':
      console.log('[MAKI:SERVICE-WORKER]', '_unlock');
      break;

    case '_list':
      db._getAll('keys', function(err, keys) {
        console.log('hello keys:', err, keys);
      });
      break;
    case '_select':
      db._getAll('keys', function(err, keys) {
        if (keys && keys.length) {
          self.identity = keys[0];
        }
      });
      break;
    case '_generate':
      var Mnemonic = require('bitcore-mnemonic');
      var mnemonic = new Mnemonic();

      var key = mnemonic.toHDPrivateKey();
      var sub = key.derive('m/0');

      self.seed = mnemonic;
      self.words = mnemonic.toString();
      self.pubkey = sub.hdPublicKey.toString();

      self.identity = {
        seed: mnemonic.toString(),
        //address: sub.hdPublicKey.toAddress(),
        key: {
          hd: true,
          private: key.toString(),
          public: self.pubkey
        }
      };

      db._store({
        private: self.identity.key.private,
        public: self.identity.key.public
      }, function(err, result) {
        console.log('identity saved:', err, result);
      });

      break;
  }

});

self.addEventListener('install', function(event) {
  console.log('[MAKI:SERVICE-WORKER]', 'install event', event);
});

self.addEventListener('fetch', function(event) {
  console.log('fetch event:', event);
  console.log('pubkey:', (self.identity) ? self.identity.public : null);

  if (self.identity) {
    var bitcore = require('bitcore-lib');
    var HDPrivateKey = bitcore.HDPrivateKey;
    var Message = require('bitcore-message');
    var privateKey = HDPrivateKey(self.identity.private).privateKey;

    console.log('privateKey:', privateKey);

    var signature = Message('hello, world').sign(privateKey);

    console.log('identity:', self.identity);
    console.log('signature:', signature);
  }


  return fetch(event.request, {
    headers: {
      'x-identity': (self.identity) ? self.identity.public : null,
      'x-signature': signature
    }
  });
});
