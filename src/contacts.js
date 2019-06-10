//load contacts
import * as crypto from './crypto.js'

import {buf, b64} from './utils.js'
import * as io from './io.js'
import {listen,silence} from './channels.js'
import load from './load.js'
import {receive} from './core.js'

const prepared = {}

export default function contacts(name,details){
	return load().then(({passphraseKey,contacts,profile})=>{
		let contact = contacts.find(contact=>contact.name===name)
		if (!contact) {
			if (details) {
				contacts.push(contact = {...details,name})
				
			}
			else
				return null
		}
		return prepared[contact.name] = prepared[contact.name] || prepare(contact,passphraseKey)
	})
}
contacts.filter = async channel=>{
	let {contacts} = await load()
	return Object.values(contacts).filter(contact=>contact.channels.includes(channel))
}

function onmessage({channel,hash}){
	receive({channel,hash},received)
}
function received(data){
	io.trigger('received',data)
	let {channels} = data
	if (channels) {
		contact.channels = contact._original.channels = channels
		silence(contact)
		listen(contact.channels,onmessage,contact)
	}
}
async function prepare(contact,passphraseKey){
	let {privateKey,publicKey,verify,sign,sign_iv} = contact.keys
	sign =  crypto.importMyPrivateSigningKey(buf(sign), passphraseKey, buf(sign_iv))
	privateKey =  crypto.importMyPrivateExchangeKey(buf(privateKey))
	publicKey =  crypto.importTheirPublicExchangeKey(buf(publicKey))	
	verify =  crypto.importTheirPublicVerificationKey(buf(verify))
	let keys = {
		privateKey: await privateKey,
		publicKey: await publicKey,
		verify: await verify,
		sign: await sign,
	}
	
	silence(contact)
	listen(contact.channels,onmessage,contact)
	return {
		_original:contact,
		...contact,
		keys
	}
}