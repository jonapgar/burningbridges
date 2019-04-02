//profile.js
const load = require('./load')
module.exports = load.then(({profile})=>profile)