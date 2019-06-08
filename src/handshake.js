//handshake.js
// import profile from './load.js'
import {str2ab,ab2str,concat,buf,b64} from './utils.js'
import profile from './profile.js'
import load from './load.js'
import * as crypto from './crypto.js'
import * as channels from './channels.js'

import * as Garbage from './garbage.js'
import * as cipher from './cipher.js'

import thing from './thing.js'
import * as transfer from './transfer.js'

import * as conf from './conf.js'
const {
	BLOCK_SIZE = 1024,
	BLOCK_COUNT = 1024,
	OBSCURITIES = [0,1,2,4,8]
} = conf
const {subtle} = window.crypto

export {send,receive}

async function generate(){

	let passphraseKey = (await load()).passphraseKey
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
    
    
	
    return keys
}

const $ = thing({ 
	
	...cipher,
	...Garbage,
	...transfer,
	
	stringify: JSON.stringify, 
	parse: JSON.parse, 
	
})

async function send(channel,phrase){
	let keys = await generate()
	let {verify,encrypt} = keys
	let handshakeKey = await crypto.getPassphraseKey(phrase,phrase)
	let {name} = await profile()
    let hash = await $(JSON.stringify({
    	name,channels:OBSCURITIES.map(o=>channels.generate(o)),keys:{verify,encrypt}}
    ))
    .then(str2ab)
    .pad(BLOCK_SIZE)
	.chop(BLOCK_COUNT)
	.then(blocks =>Promise.all(blocks.map(block => Garbage.pad(block, BLOCK_SIZE))))
	.unify()
	.then(buffer=>{
		return subtle.encrypt({
                name: "AES-CBC",
                iv:phrase
            },
            handshakeKey,
            buffer
   		)
	})
	.cipher()
	.upload()
	
	
	
	return {keys,hash}
}

async function receive (channel,phrase,lock){
	
	
	return new Promise((res,rej)=>{
		
		
		channels.listen(channel,async ({hash})=>{ //receives hash
			// if (hash===lock.hash){
			// 	console.log(`saw reflection ${hash}, vampire mode disabled`)
			// 	return
			// }		
			$(hash)	
				.download()
				.decipher()
				.then(async buffer=>{
					return $(await subtle.decrypt({
			                name: "AES-CBC",
			                iv:phrase
			            },
			            await crypto.getPassphraseKey(phrase,phrase),
			            buffer
			   		))
			   	})	
				.log(buffer => `Decrypt success!`)
				.chop(BLOCK_COUNT)
				.then(blocks => Promise.all(blocks.map(block => Garbage.trim(block))))
				.unify()
				.trim()
				.then(ab2str)
				.parse()
				.then(data=>{
					res(data)
					channels.silence(lock)
				})
		},lock)
	})

}

