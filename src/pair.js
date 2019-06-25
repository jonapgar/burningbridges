//pair.js
import * as conf from './conf.js'
import * as crypto from './crypto.js'
import {load as loadContact,contacts} from './contacts.js'
import {announce,silence} from './channels.js'
import {send,receive} from './handshake.js'
import {getNode as ipfs} from './ipfs.js'
import {write} from './console.js'
import {b64,split} from './utils.js'
import ask from './ask.js';

export default pair

const {
	PHRASE_LENGTH=16, //technically must be 16 because reused for iv for now
	NETWORK_SIZE = 16,
	HANDSHAKE_OBSCURITY=0,
	HANDSHAKE_ANNOUNCE_TIME = 10000,
	HANDSHAKE_ANNOUNCE_INTERVAL=2000
} = conf
const locks = {}
async function pair(code){
	let provided=!!code
	code = code || await share()
	let stringCode = b64(code)
	rmlock(stringCode)
	
	let [channel, phrase] = parse(code)
	let lock = locks[stringCode] = {}
	let waitForThem = receive(channel,phrase,lock)
	let {encodedKeys:myKeys,hash} = await send(channel,phrase)
	lock.hash = hash
	if (!provided) {
		await ask(`You are listening, make sure ymy partner is too by issueing this command: "pair ${stringCode}", then hit enter to announce the handshake`)
		write(`announcing hash ${hash} on channel ${channel}`)
	}
	let reciprocation
	announce(hash,channel)
	waitForThem.then(data=>reciprocation=data)
	for (let t=0;!reciprocation && t<HANDSHAKE_ANNOUNCE_TIME;t+=HANDSHAKE_ANNOUNCE_INTERVAL) {
		await (new Promise(res=>setTimeout(res,HANDSHAKE_ANNOUNCE_INTERVAL)))
		if (!reciprocation)
			announce(hash,channel)
	}
	

	
	let {encodedKeys:theirKeys,channels,name} = reciprocation || await waitForThem
	
	let {signKey:mySignKey,signIv:mySignIv,privateKey:myPrivateKey,publicKey:myPublicKey} = myKeys
	let {verifyKey:theirVerifyKey,publicKey:theirPublicKey} = theirKeys
	rmlock(stringCode)
	
	while (!name || contacts.some(contact=>contact.name==name)) {
		name = await ask(`You already have a contact named ${name}. Enter a new name for the new contact:`)
	}
	write(`Adding contact named ${name}`)
	
	loadContact(name,{channels,name,encodedKeys:{theirPublicKey,myPrivateKeys:[{myPrivateKey,myPublicKey}],theirVerifyKey,mySignKey,mySignIv}})
	return 
}

async function rmlock(key){
	if (key in locks) {
		let lock = locks[key]
		silence(lock)
		if ('hash' in lock)
			await (await ipfs()).pin.rm(lock.hash)
		delete locks[key]
	}
}

function parse(code) {
	return split(code,Math.min(NETWORK_SIZE-HANDSHAKE_OBSCURITY,code.byteLength-PHRASE_LENGTH))
}
function share(){
	return crypto.random(NETWORK_SIZE + PHRASE_LENGTH)
}



