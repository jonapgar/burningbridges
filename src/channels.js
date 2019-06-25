//channels.js
import * as conf from './conf.js'
import {random} from './crypto.js'
import {b64,b58,concat,ab2str} from './utils.js'
import {getNode as ipfs, Buffer} from './ipfs.js'
export  {generate,listen,silence,pad,listeners,announce}

const {
	NETWORK_SIZE = 16,
	IPFS_PREFIX = 'burningbridges.',
} = conf

let listeners = []

function generate(obscurity=1){
	return b64(random(Math.max(1,NETWORK_SIZE-obscurity)))
}

async function listen(channels,fn,lock) {
	if (!(channels instanceof Array))
		channels = [channels]
	for (let channel of channels) {
		let subscription =  IPFS_PREFIX + b58(channel)
		let handler = ({data})=>{
			//for now utf8
			let hash =ab2str(data)
			if (announced.includes(hash)) {
				console.error('ignore reflection')
				return
			}
			fn({hash,channel,lock})
		}
		let node = await ipfs()
		node.pubsub.subscribe(subscription,handler,{discover:true})
		listeners.push({subscription,handler,lock})
	}
}
async function silence(lock){
	
	let stay = []
	let node = await ipfs()
	for (let listener of listeners) {
		if (listener.lock===lock) {
			node.pubsub.unsubscribe(listener.subscription,listener.handler)
		} else {
			stay.push(listener)
		}
	}
	listeners = stay
}
const announced =[]
async function announce(hash,channel){
	let subscription = IPFS_PREFIX + b58(channel)
	//just pretend utf8 for now...
	let node = await ipfs()
	announced.push(hash) //could in theory keep announced list, best to hash them again though for privacy
	node.pubsub.publish(subscription,Buffer.from(hash))
	
}
function pad(channel) {
	
	return b64(concat(channel,random(NETWORK_SIZE-channel.length)))
}





