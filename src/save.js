//save.js
import * as  crypto from './crypto.js'

import {str2ab,ab2str,concat,buf,b64} from './utils.js'
const { subtle } = window.crypto
import load from './load.js'

export default async function save(data,passphrase){
	data = data || (await load)._original
	let salt = data.salt || b64(crypto.random())
	let passphraseKey = await crypto.getPassphraseKey(str2ab(passphrase), buf(salt))
    
	let iv = crypto.random()
    let encrypted = {
    	iv:b64(iv),
    	salt,
    	ciphertext:b64(await subtle.encrypt({
                name: "AES-CBC",
                iv
            },
            passphraseKey,
            str2ab(JSON.stringify(data))
   		))
    }
    let download = document.createElement('a')
    download.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(encrypted))
    download.setAttribute('download', 'keys.json')
    document.body.appendChild(download)
    download.click()
    download.remove()
    window._dirty=false
    return encrypted
}