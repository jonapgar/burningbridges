//core.js
const {
	BLOCK_SIZE = 1024,
	BLOCK_COUNT = 1024,
} = require('./conf')
const {buf,b64} = require('./utils')
const profile= require('./profile')
const io = require('./io')
const contacts = require('./contacts')
const channels = require('./channels')
const Garbage = require('./garbage')
const {encrypt,decrypt,sign,verify} = require('./crypto')



const $ = require('./thing')({ 
	encrypt,
	decrypt,
	...require('./cipher'),
	...Garbage,
	...require('./advertise'),
	...require('./torrent'),
	
	stringify: JSON.stringify, 
	parse: JSON.parse, 
	
})

const send = async ({text,recipient,obscurity})=>{
	let contact = await contacts(recipient)
	let fullChannel = channels.pad(contact.channel)
	$(text)
		.then(async message=>{
			let {keys,name} = await profile
			let signature = b64(await sign(Buffer.from(message),keys.sign))
			return {
				message,
				name,
				signature,
				channel:channels.random(obscurity)
			}
		})
		.stringify()
		.then(Buffer.from)
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
		.seed({
			name:`${fullChannel}.bbm`
		})
		.log(torrent => `Message is seeding as magnetURI ${torrent.magnetURI}`)
		.advertise(fullChannel)
		.then(data=>io.trigger('sent',data))
		.catch(e=>{
			throw e
		})

}

const receive =async (channel,magnetURI)=>{
	
	let channel
	$(magnetURI)	
		.download()

		
		.then(torrent=>{
			return new Promise((res,rej)=>{
				
				(file = torrent.files[0])
					.getBuffer((err,buffer)=>err ? rej(err):res(buffer))
			})
		})
		.decipher()
		.then(async buffer=>{
			let cleartext=null
			let error
			for (let contact of await contacts.filter(channel)) {
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
		.then(buffer=>Buffer.from(buffer).toString('utf8'))
		.log(s=>`What is this thang? ${s}`)
		.parse()
		.then(async ({message,name,signature,channel})=>{
			let contact = await contacts(name)
			let verified = await verify(buf(signature),Buffer.from(message),contact.keys.verify)
			contact.channel = contact._original.channel = channel
			channels.silence(contact)
			channels.listen(channel,receive,contact)
			return {message,name,verified}
		})
		.then(data=>io.trigger('received',data))
		.catch(e=>{
			throw e
		})	
}

module.exports  = {send,receive}

