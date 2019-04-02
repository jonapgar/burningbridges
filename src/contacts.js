//load contacts
const crypto = require('./crypto')
const {buf} = require('./utils')
const io = require('./io')
const load = require('./load')
module.exports = function contacts(name,details){
	return load.then(({contacts})=>{
		let contact = contacts[name]
		if (!contact) {
			if (!details)
				throw new Error('Contact not found')
			contacts[name] = details
			
		}
		return (contact._promise = contact._promise || prepare(contact.keys).then(keys=>{
			return {
				...contact,
				keys,
				name
			}
		}))
		
	})
}

async function prepare({encrypt,verify}){
	let encryptKey = crypto.importTheirPublicEncryptionKey(buf(encrypt))
	let verifyKey = crypto.importTheirPublicVerificationKey(buf(verify))
	return  {
		encrypt:await encryptKey,
		verify:await verifyKey
	}
}