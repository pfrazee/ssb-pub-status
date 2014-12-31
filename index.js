var ssbKeys  = require('ssb-keys')
var path     = require('path')
var explain  = require('explain-error')
var manifest = require('scuttlebot/lib/manifest')
var http     = require('http')
var pull     = require('pull-stream')
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

  pull(rpc.createHistoryStream(keys.id, 0, true), pull.drain(function(msg) {
    var d = new Date(msg.timestamp)
    var datestr = '<strong>'+(d.getMonth()+1)+'/'+pad0(d.getDate())+' '+d.getHours()+':'+pad0(d.getMinutes())+'</strong>\n\n'
    if (msg.content.type == 'post' && msg.content.postType == 'text') {
      msgs.unshift(datestr + msg.content.text)
    }
  }, console.log))
})

var banner = [
  '<strong>Hello world, I am '+keys.id+'</strong>',
  'this pub server is running <a href="https://github.com/ssbc/scuttlebot">scuttlebot</a> on the secure-scuttlebutt network',
  '',
  'latest updates:'
].join('\n')

function onRequest(req, res) {
  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Content-Security-Policy', 'default-src \'none\'; style-src \'unsafe-inline\'')
  res.writeHead(200)
  res.end('<style>body { font-family: monospace; white-space: pre-line; }</style>'+[banner].concat(msgs).join('\n\n\n\n'))
}

function pad0(v) {
  v = ''+v
  if (v.length < 2)
    return '0'+v
  return v
}