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
  connect()
})

function connect() {
  console.log('connection')
  pull(rpc.createFeedStream({ keys: true, live: true }), pull.drain(function(msg) {
    var d = new Date(msg.value.timestamp)
    var datestr = '<h3 id="'+msg.key+'">'+
      '<a href="#'+msg.key+'">'+(d.getMonth()+1)+'/'+pad0(d.getDate())+' '+d.getHours()+':'+pad0(d.getMinutes())+'</a>'+
      ' - <a href="http://localhost:2000/#/msg/'+msg.key+'">&rarr;scuttlebot</a>'+
    '</h3>'
    if (msg.value.content.type == 'post') {
      msgs.unshift(datestr + msg.value.content.text)
    }
  }, connect))
}

var banner = [
  '<h1>Hello world, I am '+keys.id+'</h1>',
  '<h2> on <a href="https://github.com/ssbc/scuttlebot">the secure-scuttlebutt network</a></h2>',
  '',
  '# I\'m a caching server for synchronizing scuttlebutt instances across networks.',
  '# This page shows the feed of posts uploaded here.',
  '',
  '  (refresh to update)',
  '',
  '',
  'If you want to be hosted by this server, <a href="https://github.com/ssbc/scuttlebot">install the scuttlebutt software</a> and get in touch with paul frazee.',
  '',
].join('\n')

function onRequest(req, res) {
  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Content-Security-Policy', 'default-src \'none\'; style-src \'unsafe-inline\'')
  res.writeHead(200)
  res.end('<style>body { font-family: monospace; white-space: pre-line; } h1 { margin: 0; font-size: 4em } h2 { margin: 0; font-size: 2em }</style>'+[banner].concat(msgs).join('\n\n\n\n'))
}

function pad0(v) {
  v = ''+v
  if (v.length < 2)
    return '0'+v
  return v
}
