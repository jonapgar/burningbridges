//load.js
import * as io from './io.js'

import * as crypto from './crypto.js'
import {receive} from './core.js'
import {listen} from './channels.js'
const { subtle } = window.crypto
import {str2ab,ab2str,concat,buf,b64} from './utils.js'
const profile = {}
export default new Promise(res => {
    io.on('login:data',res)
 }).then(async ({data,passphrase})=>{
	
	

	
	let salt = buf(data.salt)
	let passphraseKey = await crypto.getPassphraseKey(str2ab(passphrase), salt)
	let cleartext = ab2str(await subtle.decrypt({
        name: "AES-CBC",
        iv:buf(data.iv)
    },
    passphraseKey, buf(data.ciphertext)))
	data = JSON.parse(cleartext)
		
	for (let contact of data.contacts) {
		listen(contact.channel,receive,contact)
	}
	
	return Object.assign(profile,{
		_original:data,
		contacts:data.contacts,
		passphraseKey,
	    profile:{
	    	_original:data.profile,
	    	...data.profile
    	}
	})
}).catch(err=>{
	alert('Error loading profile',err)
	throw err
})