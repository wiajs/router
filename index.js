if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/router.cmn.js')
} else {
  module.exports = require('./dist/router.cmn.js')
}
