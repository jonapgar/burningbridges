//save.js
import * as  crypto from './crypto.js'
import {contacts} from './contacts.js'
import {str2ab,buf,b64} from './utils.js'
import * as conf from './conf.js'
const {
	LOCAL_STORAGE='burningbridges' + window.location.hash
} = conf
const { subtle } = window.crypto
import load from './load.js'

export default async function save(data,passphrase){
    data = data || (await load())
    data.contacts = contacts.map(contact=>{
        let {name,channels,encodedKeys} = contact
        return {name,channels,encodedKeys}
    })
	let salt = data.salt = data.salt || b64(crypto.random())
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
    let json = JSON.stringify(encrypted)
    if(LOCAL_STORAGE) {
        window.localStorage.setItem(LOCAL_STORAGE,json)
    }
    let download = document.createElement('a')
    download.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(json)
    download.setAttribute('download', 'keys.json')
    document.body.appendChild(download)
    download.click()
    download.remove()
    
    window._dirty=false
    return encrypted
}