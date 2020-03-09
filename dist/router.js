if (process.env.NODE_ENV === 'production') {
  module.exports = require('./router.common.min.js')
} else {
  module.exports = require('./router.common.js')
}
