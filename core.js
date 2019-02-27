//core.js
const {
	BLOCK_SIZE = 1024,
	BLOCK_COUNT = 1024,
} = require('./conf')

const profile = require('./profile')
const io = require('./io')
const contacts = require('./contacts')
const {encrypt,decrypt,sign,verify} = require('./crypto')
const {
  bufferToHex,
  hexToBuffer,
} =require('./unibabel.js')


const Message = require('./thing')({ 
	encrypt,
	decrypt,
	...require('./cipher'),
	...(Garbage = require('./garbage')),
	...require('./advertise'),
	...require('./torrent'),
	
	stringify: JSON.stringify, 
	parse: JSON.parse, 
	buffer: Buffer.from,
	toString:(s,encoding)=>s.toString(encoding)
})

io.on('message',async ({text,recipient})=>{
	Message(text)
		.then(async message=>{
			let {keys,name} = await profile
			let signature = bufferToHex(await sign(Buffer.from(message),hexToBuffer(keys.sign)))
			return {
				message,
				name,
				signature
			}
		})
		.stringify()
		.buffer('utf8')
		.pad(BLOCK_SIZE)
		.chop(BLOCK_COUNT)
		.log(blocks => `Split message into ${blocks.length} pieces`)
		.then(blocks =>Promise.all(blocks.map(block => Garbage.pad(block, BLOCK_SIZE))))
		.log(blocks => `Padded ${blocks.length} pieces`)	
		.unify()
		.log(buffer => `Unified  pieces`)
		.encrypt(hexToBuffer((await contacts(recipient)).keys.encrypt))
		.log(buffer => `Encrypted message`)
		.cipher()
		.log(buffer => `Jumbled message`)
		.seed()
		.log(torrent => `Message is seeding as magnetURI ${torrent.magnetURI}`)
		.advertise()
		.then(data=>io.trigger('sent',data))
		.catch(e=>{
			throw e
		})

})

io.on('receive',async magnetURI=>{
	Message(magnetURI)	
		.download()
		.log(buffer => `Decrypt success!`)
		.then(torrent=>new Promise((res,rej)=>(file = torrent.files[0]).getBuffer((err,buffer)=>err ? rej(err):res(buffer))))
		.decipher()
		.decrypt(hexToBuffer((await profile).keys.decrypt))
		.log(buffer => `Decrypt success!`)
		.chop(blocks)
		.then(buffers => Promise.all(buffers.map(buffer => trim(buffer))))
		.unify()
		.trim()
		.toString()
		.parse()
		.then(async ({message,name,signature})=>{
			let verified = await Crypto.verify(hexToBuffer(signature),Buffer.from(message),hexToBuffer((await contacts(name)).keys.verify))
			return {message,name,verified}
		})
		.then(data=>io.trigger('received',data))
		.catch(e=>{
			throw e
		})	
})

