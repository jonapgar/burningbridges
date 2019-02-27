//load contacts
const io = require('./io')
let list = new Promise(res=>{
	io.on('login:data',data=>res(data.contacts))
})
module.exports = function contacts(name){
	return list.then(contacts=>contacts[name])
}