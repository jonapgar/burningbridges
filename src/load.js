//load.js

import * as crypto from './crypto.js'
const { subtle } = window.crypto
import {str2ab,ab2str,buf} from './utils.js'

const profile = {}
let loaded

export default  ({data,passphrase}={})=>{
	return data ? (loaded = ondata({data,passphrase})):(loaded || Promise.reject(new Error('Not logged in')))
}

async function ondata({data,passphrase}){

	let salt = buf(data.salt)
	let passphraseKey = await crypto.getPassphraseKey(str2ab(passphrase), salt)
	let cleartext = ab2str(await subtle.decrypt({
        name: "AES-CBC",
        iv:buf(data.iv)
    },
    passphraseKey, buf(data.ciphertext)))
	data = JSON.parse(cleartext)
	
	
	return Object.assign(profile,{
		_original:data,
		contacts:data.contacts,
		passphraseKey,
	    profile:{
	    	_original:data.profile,
	    	...data.profile
    	}
	})
}