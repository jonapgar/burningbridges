//load.js
const io = require('./io')
const {buf,b64} = require('./utils')
const crypto = require('./crypto')
const { subtle } = window.crypto
module.exports = new Promise(res => {
    io.on('login:data',res)
 }).then(async data=>{
	
	

	let passphraseKey

	if (data.stub) {

		data.profile = {name:prompt("Enter your name")}
		let salt = crypto.random()
	 	passphraseKey = await crypto.getPassphraseKey(Buffer.from(window.prompt('Enter your passphrase')), salt)
	    let keys = {
	        ...await crypto.generateSignVerify(passphraseKey),
	        ...await crypto.generateEncryptDecrypt(passphraseKey)
	    }
	    keys.sign = b64(keys.sign)
	    keys.sign_iv = b64(keys.sign_iv)
	    keys.verify = b64(keys.verify)
	    keys.encrypt = b64(keys.encrypt)
	    keys.decrypt = b64(keys.decrypt)
	    keys.decrypt_iv = b64(keys.decrypt_iv)
	    data.profile.keys = keys
	    data.salt = b64(salt)
	    require('./save')(data,passphraseKey)
	} else {
		let salt = buf(data.salt)
		passphraseKey = await crypto.getPassphraseKey(Buffer.from(window.prompt('Enter your passphrase')), salt)
		let cleartext = Buffer.from(await subtle.decrypt({
            name: "AES-CBC",
            iv:buf(data.iv)
        },
        passphraseKey, buf(data.ciphertext))).toString('utf8')
		data = JSON.parse(cleartext)
	}

	let keys = data.profile.keys
	let signKey = crypto.importMyPrivateSigningKey(buf(keys.sign), passphraseKey, buf(keys.sign_iv))
	let decryptKey = crypto.importMyPrivateDecryptionKey(buf(keys.decrypt), passphraseKey, buf(keys.decrypt_iv))
	return {
		_original:data,
		contacts:data.contacts,
	    profile:{
	    	...data.profile,

	    	keys:{
			    sign: await signKey,
			    decrypt: await decryptKey
			}	
    	}
	}
}).catch(err=>{
	alert('Error loading profile',err)
	throw err
})