//save.js
const { subtle } = window.crypto
const crypto = require('./crypto')
const {buf,b64} = require('./utils')
module.exports= async (data,passphraseKey)=>{
	data = data || (await require('./load'))._original
	passphraseKey = passphraseKey || await crypto.getPassphraseKey(Buffer.from(window.prompt('Enter your passphrase')), buf(data.salt))

	let iv = crypto.random()
    let encrypted = {
    	iv:b64(iv),
    	salt:data.salt,
    	ciphertext:b64(await subtle.encrypt({
                name: "AES-CBC",
                iv
            },
            passphraseKey,
            Buffer.from(JSON.stringify(data))
   		))
    }
    let download = document.createElement('a')
    download.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(encrypted))
    download.setAttribute('download', 'keys.json')
    document.body.appendChild(download)
    download.click()
    download.remove()
    window._dirty=false
    
}