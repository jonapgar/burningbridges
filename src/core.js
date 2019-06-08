//core.js

import {str2ab,ab2str,concat,buf,b64} from './utils.js'
import profile from './profile.js'
import {announce} from './channels.js'
import * as io from './io.js'
import contacts from './contacts.js'

import * as Garbage from './garbage.js'
import {encrypt,decrypt,sign,verify} from './crypto.js'
import * as cipher from './cipher.js'
import * as transfer from './transfer.js'

import thing from './thing.js'

import * as conf from './conf.js'
const {
	BLOCK_SIZE = 1024,
	BLOCK_COUNT = 1024,
} = conf



export {send,receive}

const $ = thing({ 
	encrypt,
	decrypt,
	announce,
	...cipher,
	...Garbage,
	...transfer,
	
	stringify: JSON.stringify, 
	parse: JSON.parse, 
	
})

async function send({text,contact,obscurity=0,channels}){
	contact = typeof contact ==='string' ? await contacts(recipient):contact
	let channel = contact.channels[obscurity]
	return $(text)
		.then(async message=>{
			let {name} = await profile()
			let buffer = str2ab(JSON.stringify({
				message,name,channels
			}))
			return {
				data: b64(buffer),
				signature: b64(await sign(buffer,contact.keys.sign))
			}
		})
		.stringify()
		.then(str2ab)
		.pad(BLOCK_SIZE)
		.chop(BLOCK_COUNT)
		.log(blocks => `Split message into ${blocks.length} pieces`)
		.then(blocks =>Promise.all(blocks.map(block => Garbage.pad(block, BLOCK_SIZE))))
		.log(blocks => `Padded ${blocks.length} pieces`)	
		.unify()
		.log(buffer => `Unified  pieces`)
		.encrypt(contact.keys.encrypt)
		.log(buffer => `Encrypted message`)
		.cipher()
		.log(buffer => `Jumbled message`)
		.upload()
		.announce(channel)
		.catch(e=>{
			throw e
		}).promise

}

async function receive ({channel,hash},tap){
	
	
	$(hash)	
		.download()
		.decipher()
		.then(async buffer=>{
			let cleartext=null
			let error
			for (let contact of await contacts.filter(channel)) {
				contact = await contacts(contact.name)
				try {
					cleartext = await decrypt(buffer,contact.keys.decrypt)
				} catch(e){
					error = e
					continue
				}
				break
			}
			if (cleartext===null)
				throw error || new Error('No matching contacts')
			return cleartext
		})
		.log(buffer => `Decrypt success!`)
		.chop(BLOCK_COUNT)
		.then(blocks => Promise.all(blocks.map(block => Garbage.trim(block))))
		.unify()
		.trim()
		.then(ab2str)
		.log(s=>`What is this thang? ${s}`)
		.parse()
		.then(async ({data,signature})=>{
			
			let buffer= buf(data)
			let parsed = JSON.parse(ab2str(buffer))
			let contact = await contacts(parsed.name)
			await verify(buf(signature),buffer,contact.keys.verify)
			
			return parsed
		})
		.tap(tap)
		.catch(e=>{
			throw e
		})
}



