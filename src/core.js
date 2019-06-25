//core.js

import {str2ab,ab2str,concat,buf,b64} from './utils.js'

import {announce} from './channels.js'
import * as io from './io.js'
import {load as loadContact,lookup as lookupContactsByChannel} from './contacts.js'

import * as Garbage from './garbage.js'
import {sign,encrypt,decrypt,getSecretKey,generateExchange,verify,importTheirPublicExchangeKey, random} from './crypto.js'
import * as cipher from './cipher.js'
import * as transfer from './transfer.js'
const {subtle} = window.crypto
import thing from './thing.js'

import * as conf from './conf.js'
import { write } from './console.js';
const {
	BLOCK_SIZE = 1024,
	BLOCK_COUNT = 1024,
	SIGNATURE_LENGTH=64,
	PUBLICKEY_LENGTH=91,
	TOKEN_LENGTH=16,
} = conf



export {send,receive}

const $ = thing({ 
	announce,
	...cipher,
	...Garbage,
	...transfer
	
})

async function send({buffer,contact,obscurity=0}){
	contact = typeof contact ==='string' ? await loadContact(contact):contact
	let channel = contact.channels[obscurity]
	return $(buffer)
		.pad(BLOCK_SIZE)
		.chop(BLOCK_COUNT)
		.log(blocks => `Split message into ${blocks.length} pieces`)
		.then(blocks =>Promise.all(blocks.map(block => Garbage.pad(block, BLOCK_SIZE))))
		.log(blocks => `Padded ${blocks.length} pieces`)	
		.unify()
		.log(buffer => `Unified  pieces`)
		.then(async buffer=>{
			let {publicKey,privateKey} = await generateExchange()
			let myPublicKeyBuffer = await subtle.exportKey('spki',publicKey)
			let myPublicKey = b64(myPublicKeyBuffer)
			contact.encodedKeys.myPrivateKeys.push({
				myPrivateKey:b64(await subtle.exportKey('pkcs8',privateKey)),
				myPublicKey //string for comparison later
			})
			contact.realKeys.myPrivateKeys.push({
				myPrivateKey:privateKey,
				myPublicKeyBuffer
			}) 

			let ciphertext = await encrypt(
				buffer,
				await getSecretKey({theirPublicKey:contact.realKeys.theirPublicKey,myPrivateKey:privateKey})
			)		
			let theirPublicKeyBuffer = buf(contact.encodedKeys.theirPublicKey)
			let data = concat(myPublicKeyBuffer,theirPublicKeyBuffer,ciphertext)
			let signature = await sign(data,contact.realKeys.mySignKey)
			return concat(signature,data)
		})
		.log(buffer => `Encrypted message`)
		.cipher()
		.log(buffer => `Jumbled message`)
		.upload()
		.announce(channel)
		.catch(e=>{
			throw e
		}).promise

}

const seen = {}
async function receive ({channel,hash},tap){
	if (hash in seen)
		return
	seen[hash]= true //todo remove
	let verifiedContact
	$(hash)	
		.download()
		.decipher()
		.then(async buffer=>{
			let cleartext=null
			let error
			for (let contact of await lookupContactsByChannel(channel)) {
				contact = await loadContact(contact.name)
				try {
					let i=0
					let signature = buffer.slice(i,i+=SIGNATURE_LENGTH)
					let data = buffer.slice(i)
					await verify(signature,data,contact.realKeys.theirVerifyKey)
					verifiedContact = contact
					let theirPublicKeyBuffer = buffer.slice(i,i+=PUBLICKEY_LENGTH)
					let myPublicKeyBuffer = buffer.slice(i,i+=PUBLICKEY_LENGTH)
					let ciphertext = buffer.slice(i)
					
					
					let keyIndex = contact.realKeys.myPrivateKeys.findIndex(kp=>b64(myPublicKeyBuffer)==b64(kp.myPublicKeyBuffer)) //todo compare as buffers...
					
					if (keyIndex===-1){
						throw new Error(`Missing corresponding privateKey`)
					}
					let {myPrivateKey} = contact.realKeys.myPrivateKeys[keyIndex]

					contact.realKeys.theirPublicKey = await importTheirPublicExchangeKey(theirPublicKeyBuffer)
					contact.realKeys.myPrivateKeys = contact.realKeys.myPrivateKeys.slice(keyindex)
					contact.encodedKeys.myPrivateKeys = contact.encodedKeys.myPrivateKeys.slice(keyindex)
					contact.encodedKeys.theirPublicKey = b64(theirPublicKeyBuffer)
					return decrypt(ciphertext,
						await getSecretKey({theirPublicKey,myPrivateKey})
					)
				} catch(e){

					error = e
					continue
				}
			}
			throw error
		})
		.log(buffer => `Decrypt success!`)
		.chop(BLOCK_COUNT)
		.then(blocks => Promise.all(blocks.map(block => Garbage.trim(block))))
		.unify()
		.trim()
		.tap(tap)
		.catch(e=>{
			console.error(e) //todo unpin?
		})
}



