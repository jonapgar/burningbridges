//load contacts
import * as crypto from './crypto.js'
crypto.test()
import {buf, b64} from './utils.js'
import * as io from './io.js'
import {listen,silence} from './channels.js'
import load from './load.js'
import {receive} from './core.js'
export default function contacts(name,details){
	return load().then(({passphraseKey,contacts,profile})=>{
		
		let contact = contacts.find(contact=>contact.name===name)
		if (!contact) {
			if (details) {
				contacts.push(contact = {...details})
			}
			else
				return null
		}
		// contact = Object.assign({},contact)
		// let {decrypt,decrypt_iv} = await crypto.generateEncryptDecrypt(passphraseKey)
		// let {sign,sign_iv} = await crypto.generateSignVerify(passphraseKey)
		// Object.assign(contact.keys, {decrypt:b64(decrypt),decrypt_iv:b64(decrypt_iv),sign:b64(sign),sign_iv:b64(sign_iv)})
		
		return prepare(contact,passphraseKey).then(({keys})=>{
			silence(contact)
			listen(contact.channels,onmessage,contact)
			return {
				_original:contact,
				...contact,
				keys,
				name
			}
		})
		
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
	let {encrypt,verify,decrypt,decrypt_iv,sign,sign_iv} = contact.keys
	let signKey = crypto.importMyPrivateSigningKey(buf(sign), passphraseKey, buf(sign_iv))
	let decryptKey = crypto.importMyPrivateDecryptionKey(buf(decrypt), passphraseKey, buf(decrypt_iv))
	let encryptKey = crypto.importTheirPublicEncryptionKey(buf(encrypt))
	let verifyKey = crypto.importTheirPublicVerificationKey(buf(verify))
	
	
	return {
		keys:{
			encrypt:await encryptKey,
			verify:await verifyKey,
			sign:await signKey,
			decrypt: await decryptKey
		}
	} 
}