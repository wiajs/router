if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/router.common.min.js')
} else {
  module.exports = require('./dist/router.common.js')
}
