function Mnemonic(config) {
  var self = this;
  if (!config) config = {};

  var bitcore = require('bitcore-lib');
  var Message = require('bitcore-message');

  var HDPrivateKey = bitcore.HDPrivateKey;
  var HDPublicKey = bitcore.HDPublicKey;
  //var HDPublicKey = HDPrivateKey.hdPublicKey; // bitcore inconsistent here

  self.name = 'identity-mnemonic';
  self.config = config;
  self.extends = {
    services: {
      http: {
        worker: __dirname + '/worker.js',
        client: __dirname + '/client.js',
        middleware: function(req, res, next) {
          if (self.config.exclusive && !req.headers['x-identity']) {
            var err = new Error( req.client.authorizationError );
            err.status = 401;
            return next(err);
          }

          var identity = req.headers['x-identity'];
          var signature = req.headers['x-signature'];

          if (!identity || !signature) {
            req.identity = null;
            return next();
          }

          console.log('middleware identity:', identity, signature);
          console.log('requested:', req.method, req.path);

          var purportedKey = new HDPublicKey(identity);
          var address = purportedKey.publicKey.toAddress().toString();
          var verified = Message('hello, world').verify(address, signature);

          console.log('verified:', verified);

          if (verified) {
            req.identity = purportedKey;
          }

          console.log('resulting identity:', req.identity);
          console.log('resulting address:', address);
          console.log('resulting signature:', signature);

          return next();
        }
      }
    }
  };
}


module.exports = Mnemonic;
