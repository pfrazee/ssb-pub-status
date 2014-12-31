var ssbKeys  = require('ssb-keys')
var path     = require('path')
var explain  = require('explain-error')
var manifest = require('scuttlebot/lib/manifest')
var http     = require('http')
var config   = require('./config')

var keys = ssbKeys.loadOrCreateSync(path.join(config.path, 'secret'))
var rpc = require('scuttlebot/client')(config.sbot_address, manifest, function (err) {
  if(err) throw err
})
var msgs = []

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

  http.createServer(onRequest).listen(config.port)
  console.log('listening on', config.port)
})

var banner = [
  '<strong>Hello world, I am '+keys.id+'</strong>',
  'this pub server is running <a href="https://github.com/ssbc/scuttlebot">scuttlebot</a> on the secure-scuttlebutt network',
].join('\n')
msgs.push('<small>12/30 5:15pm</small>\nThings are going great here. How are you?')

function onRequest(req, res) {
  res.setHeader('Content-Type', 'text/html')
  res.writeHead(200)
  res.end('<style>body { font-family: monospace; white-space: pre }</style>'+[banner].concat(msgs).join('\n\n'))
}