//core.js

import {str2ab,ab2str,concat,buf,b64} from './utils.js'
import profile from './profile.js'
import {announce} from './channels.js'
import * as io from './io.js'
import contacts from './contacts.js'

import * as Garbage from './garbage.js'
import {sign,encrypt,decrypt,getSecretKey,generateExchange,verify,importTheirPublicExchangeKey} from './crypto.js'
import * as cipher from './cipher.js'
import * as transfer from './transfer.js'
const {subtle} = window.crypto
import thing from './thing.js'

import * as conf from './conf.js'
const {
	BLOCK_SIZE = 1024,
	BLOCK_COUNT = 1024,
	SIGNATURE_LENGTH=64,
	PUBLICKEY_LENGTH=91,
} = conf



export {send,receive}

const $ = thing({ 
	announce,
	...cipher,
	...Garbage,
	...transfer
	
})

async function send({text,contact,obscurity=0,channels}){
	contact = typeof contact ==='string' ? await contacts(recipient):contact
	let channel = contact.channels[obscurity]
	return $(text)
		.then(str2ab)
		.pad(BLOCK_SIZE)
		.chop(BLOCK_COUNT)
		.log(blocks => `Split message into ${blocks.length} pieces`)
		.then(blocks =>Promise.all(blocks.map(block => Garbage.pad(block, BLOCK_SIZE))))
		.log(blocks => `Padded ${blocks.length} pieces`)	
		.unify()
		.log(buffer => `Unified  pieces`)
		.then(async buffer=>{
			let {publicKey,privateKey} = await generateExchange()
			contact._original.keys.privateKey = b64(subtle.exportKey('pkcs8',privateKey))
			contact.keys.privateKey = privateKey

			let ciphertext = await encrypt(
				buffer,
				await getSecretKey(contact.keys)
			)		
			let data = concat(publicKey,ciphertext)
			let signature = await sign(data,contact.keys.sign)
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
	seen[hash]= true //todo 
	let verifiedContact
	$(hash)	
		.download()
		.decipher()
		.then(async buffer=>{
			let cleartext=null
			let error
			for (let contact of await contacts.filter(channel)) {
				contact = await contacts(contact.name)
				try {
					let i=0
					let signature = buffer.slice(0,i+=SIGNATURE_LENGTH)
					let data = buffer.slice(i)
					let publicKey = buffer.slice(i,i+=PUBLICKEY_LENGTH)
					let ciphertext = buffer.slice(i)
					await verify(signature,data,contact.keys.verify)
					verifiedContact = contact
					contact._original.keys.publicKey = b64(publicKey)
					contact.keys.publicKey = await importTheirPublicExchangeKey(publicKey)
					return decrypt(ciphertext,
						await getSecretKey(contact.keys)
					)
				} catch(e){
					error = e
					continue
				}
				break
			}
			throw error
		})
		.log(buffer => `Decrypt success!`)
		.chop(BLOCK_COUNT)
		.then(blocks => Promise.all(blocks.map(block => Garbage.trim(block))))
		.unify()
		.trim()
		.then(ab2str)
		.log(s=>`What is this thang? ${s}`)
		.then(async message=>{
			return {message,name:verifiedContact.name}
		})
		.tap(tap)
		.catch(e=>{
			throw e
		})
}



