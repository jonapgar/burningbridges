//handshake.js
const profile = require('load')

const generate = async ()=>{

	let passphraseKey = (await load).passphraseKey
	let keys = {
        ...await crypto.generateSignVerify(passphraseKey),
        ...await crypto.generateEncryptDecrypt(passphraseKey)
    }
    keys.sign = b64(keys.sign)
    keys.sign_iv = b64(keys.sign_iv)
    keys.verify = b64(keys.verify)
    keys.encrypt = b64(keys.encrypt)
    keys.decrypt = b64(keys.decrypt)
    keys.decrypt_iv = b64(keys.decrypt_iv)
    
    

    return keys
}

const send = async (channel,phraseBuffer)=>{
	let keys = await generate()
	let {verify,encrypt} = keys
	let handshakeKey = await crypto.getPassphraseKey(phraseBuffer,phraseBuffer)
	let fullChannel = channels.pad(channel)
    await $(JSON.stringify({
    	channel:channels.random(),keys:{verify,encrypt}}
    ))
    .then(Buffer.from)
    .pad(BLOCK_SIZE)
	.chop(BLOCK_COUNT)
	.then(blocks =>Promise.all(blocks.map(block => Garbage.pad(block, BLOCK_SIZE))))
	.unify()
	.then(buffer=>{

		let iv = crypto.random()
		return subtle.encrypt({
                name: "AES-CBC",
                iv
            },
            handshakeKey,
            buffer
   		)
	})
	.cipher()
	.seed({
		name:`${fullChannel}.bbh`
	})
	.log(torrent => `handshake is seeding as magnetURI ${torrent.magnetURI}`)
	.advertise(fullChannel)

	return keys
}

const receive = (channel,phraseBuffer)=>{
	
	let handshakeKey = await crypto.getPassphraseKey(phraseBuffer,phraseBuffer)
	
	
	return new Promise((res,rej)=>{
		
		let lock = {}
		channels.listen(channel,async (channel,magnetURI)=>{
			$(magnetURI)	
				.download()
				.then(torrent=>new Promise((res,rej)=>(file = torrent.files[0]).getBuffer((err,buffer)=>err ? rej(err):res(buffer))))
				.decipher()
				.then(buffer=>{
					return $(await subtle.decrypt({
			                name: "AES-CBC",
			                iv
			            },
			            await crypto.handshakeKey(phraseBuffer,phraseBuffer),
			            buffer
			   		))
			   	})	
				.log(buffer => `Decrypt success!`)
				.chop(BLOCK_COUNT)
				.then(blocks => Promise.all(blocks.map(block => Garbage.trim(block))))
				.unify()
				.trim()
				.then(buffer=>Buffer.from(buffer).toString('utf8'))
				.parse()
				.then(({keys})=>{
					res(keys)
					channels.silence(lock)
				})
		},lock)
	})

}

module.exports = {send,receive}