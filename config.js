var path = require('path')

var nonPrivate = require('non-private-ip')

module.exports = require('rc')('pubstatus', {
  hostname: nonPrivate() || '',
  port: 8000,
  path: path.join(process.env.HOME, '.ssb'),
  sbot_address: 'localhost'
})
