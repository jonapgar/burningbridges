//channels.js
import * as conf from './conf.js'
import {b64,concat} from './utils.js'
const {
	NETWORK_SIZE = 10
} = conf

const listeners = []

function random(obscurity=0.5){
	return b64(window.crypto.getRandomValues(new Uint8Array(1+Math.floor(obscurity*(NETWORK_SIZE-1)))))
}
function listen(channel,handler,lock) {
	listeners.push({channel,handler,lock})
}
function silence(lock){
	listeners.splice(listeners.findIndex(listener=>listener.lock==lock),1)
}
function pad(channel) {
	
	return b64(concat(channel,window.crypto.getRandomValues(new Uint8Array(NETWORK_SIZE-channel.length))))	
}


export  {random,listen,silence,pad,listeners}