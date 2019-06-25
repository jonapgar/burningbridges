//handshake.js
// import profile from './load.js'
import {str2ab,ab2str,concat,buf,b64} from './utils.js'

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
	let {passphraseKey} = await load()
	
	let keys = {
		
		...await crypto.exportSignVerify(passphraseKey),
		...await crypto.generateExchange()
	}
	let encodedKeys = {
		signKey: b64(keys.signKey),
		signIv: b64(keys.signIv),
		verifyKey: b64(keys.verifyKey),
		publicKey: b64(await subtle.exportKey('spki',keys.publicKey)),
		privateKey: b64(await subtle.exportKey('pkcs8',keys.privateKey)),
	}
    
    return encodedKeys
}

const $ = thing({ 
	
	...cipher,
	...Garbage,
	...transfer,
	
	stringify: JSON.stringify, 
	parse: JSON.parse, 
	
})

async function send(channel,phrase){
	let encodedKeys = await generate()
	let {verifyKey,publicKey} = encodedKeys
	let handshakeKey = await crypto.getPassphraseKey(phrase,phrase)
	
    let hash = await $(JSON.stringify({
		name:(await load()).profile.name,channels:OBSCURITIES.map(o=>channels.generate(o)),encodedKeys:{verifyKey,publicKey}
	}))
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
	
	
	
	return {encodedKeys,hash}
}

async function receive (channel,phrase,lock){
	
	
	return new Promise((res,rej)=>{
		
		
		channels.listen(channel,async ({hash})=>{ //receives hash
			if (hash===lock.hash){
				throw new Error(`Saw reflection ${hash}.`)
			}		
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

