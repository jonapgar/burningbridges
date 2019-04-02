//core.js
const {
	BLOCK_SIZE = 1024,
	BLOCK_COUNT = 1024,
} = require('./conf')
const {buf,b64} = require('./utils')
const profile= require('./profile')
const io = require('./io')
const contacts = require('./contacts')
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

io.on('message',async ({text,recipient})=>{
	$(text)
		.then(async message=>{
			let {keys,name} = await profile
			let signature = b64(await sign(Buffer.from(message),keys.sign))
			return {
				message,
				name,
				signature
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
		.encrypt((await contacts(recipient)).keys.encrypt)
		.log(buffer => `Encrypted message`)
		.cipher()
		.log(buffer => `Jumbled message`)
		.seed({
			name:'b.b'
		})
		.log(torrent => `Message is seeding as magnetURI ${torrent.magnetURI}`)
		.advertise()
		.then(data=>io.trigger('sent',data))
		.catch(e=>{
			throw e
		})

})

io.on('receive',async magnetURI=>{
	
	$(magnetURI)	
		.download()
		.log(buffer => `Decrypt success!`)
		.then(torrent=>new Promise((res,rej)=>(file = torrent.files[0]).getBuffer((err,buffer)=>err ? rej(err):res(buffer))))
		.decipher()
		.decrypt((await profile).keys.decrypt)
		.log(buffer => `Decrypt success!`)
		.chop(BLOCK_COUNT)
		.then(blocks => Promise.all(blocks.map(block => Garbage.trim(block))))
		.unify()
		.trim()
		.then(buffer=>Buffer.from(buffer).toString('utf8'))
		.log(s=>`What is this thang? ${s}`)
		.parse()
		.then(async ({message,name,signature})=>{
			let verified = await verify(buf(signature),Buffer.from(message),(await contacts(name)).keys.verify)
			return {message,name,verified}
		})
		.then(data=>io.trigger('received',data))
		.catch(e=>{
			throw e
		})	
})

