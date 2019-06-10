//pair.js
import * as conf from './conf.js'
import * as crypto from './crypto.js'
import contacts from './contacts.js'
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
	code = code || await share() //await jerk()
	let stringCode = b64(code)
	rmlock(stringCode)
	
	let [channel, phrase] = parse(code)
	let lock = locks[stringCode] = {}
	let waitForThem = receive(channel,phrase,lock)
	let {keys:ourKeys,hash} = await send(channel,phrase)
	lock.hash = hash
	if (!provided) {
		await ask(`You are listening, make sure your partner is too by issueing this command: "pair ${stringCode}", then hit enter to announce the handshake`)
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
	

	
	let {keys:theirKeys,channels,name} = reciprocation || await waitForThem
	
	let {sign,sign_iv,privateKey} = ourKeys
	let {verify,publicKey} = theirKeys
	contacts(name,{channels,name,keys:{publicKey,privateKey,verify,sign,sign_iv}})
	rmlock(stringCode)
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



