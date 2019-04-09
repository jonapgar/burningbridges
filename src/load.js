//load.js
const io = require('./io')
const {buf,b64} = require('./utils')
const crypto = require('./crypto')
const {receive} = require('./core')
const channels = require('./channels')
const { subtle } = window.crypto
module.exports = new Promise(res => {
    io.on('login:data',res)
 }).then(async data=>{
	
	

	let passphraseKey
	let salt = buf(data.salt)
	passphraseKey = await crypto.getPassphraseKey(Buffer.from(window.prompt('Enter your passphrase')), salt)
	let cleartext = Buffer.from(await subtle.decrypt({
        name: "AES-CBC",
        iv:buf(data.iv)
    },
    passphraseKey, buf(data.ciphertext))).toString('utf8')
	data = JSON.parse(cleartext)
		
	for (let contact of data.contacts) {
		channels.listen(contact.channel,receive,contact)
	}
	
	return {
		_original:data,
		contacts:data.contacts,
		passphraseKey,
	    profile:{
	    	_original:data.profile,
	    	...data.profile
    	}
	}
}).catch(err=>{
	alert('Error loading profile',err)
	throw err
})