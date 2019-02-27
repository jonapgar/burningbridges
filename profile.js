//profile.js
const io = require('./io')
module.exports = new Promise(res=>{
	io.on('login:data',data=>res(data.profile))
})