var ssbKeys  = require('ssb-keys')
var path     = require('path')
var explain  = require('explain-error')
var manifest = require('scuttlebot/lib/manifest')
var config   = require('./config')

var keys = ssbKeys.loadOrCreateSync(path.join(config.path, 'secret'))
var rpc = require('scuttlebot/client')(config.sbot_address, manifest, function (err) {
  if(err) throw err
})

rpc.auth(ssbKeys.signObj(keys, {
  role: 'client',
  ts: Date.now(),
  public: keys.public
}), function (err) {
  if(err) {
    if(err.code === 'ECONNREFUSED')
      throw explain(err, 'Scuttlebot server is not running')
    else
      throw explain(err, 'auth failed')
  }
  rpc.whoami(function(err, data) {
    console.log(err, data)
    process.exit()
  })
})