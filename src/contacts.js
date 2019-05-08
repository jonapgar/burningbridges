//load contacts
import * as crypto from './crypto.js'
import {buf} from './utils.js'
// import io from './io'
import {listen} from './channels.js'
import load from './load.js'
import {receive} from './core.js'

export default function contacts(name,details){
	return load.then(({passphraseKey,contacts})=>{
		let contact = contacts[name]
		if (!contact) {
			if (details) {
				contact = contacts[name]={...details}    
				
			}
			else
				return null
		}
		return (contact._promise = contact._promise || prepare(contact,passphraseKey).then(({keys})=>{
			return {
				_original:contact,
				...contact,
				keys,
				name
			}
		}))
		
	})
}
contacts.filter = async channel=>{
	let {contacts} = await load
	return Object.values(contacts).filter(contact=>channel.startsWith(contact.channel))
}

async function prepare(contact,passphraseKey){
	let {encrypt,verify,decrypt,decrypt_iv,sign,sign_iv} = contact.keys

	
	let signKey = crypto.importMyPrivateSigningKey(buf(sign), passphraseKey, buf(sign_iv))
	let decryptKey = crypto.importMyPrivateDecryptionKey(buf(decrypt), passphraseKey, buf(decrypt_iv))
	let encryptKey = crypto.importTheirPublicEncryptionKey(buf(encrypt))
	let verifyKey = crypto.importTheirPublicVerificationKey(buf(verify))

	listen(contact.channel,receive,contact)
	return {
		keys:{
			encrypt:await encryptKey,
			verify:await verifyKey,
			sign:await signKey,
			decrypt: await decryptKey
		}
	} 
}