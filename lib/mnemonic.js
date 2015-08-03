function Mnemonic(config) {
  var self = this;
  if (!config) config = {};

  console.log('booting mnemonic');

  var bitcore = require('bitcore');
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
          if (identity) {
            req.identity = new HDPublicKey(identity);
          } else {
            req.identity = null;
          }

          console.log('resulting identity:', req.identity);

          return next();
        }
      }
    }
  };
}


module.exports = Mnemonic;
