//channels.js
const {
	NETWORK_SIZE = 10
} = require('./conf')

const listeners = []
const channels = module.exports =  {
	random(obscurity=0){
		return b64(window.crypto.getRandomValues(new Uint8Array(NETWORK_SIZE-security)))
	},
	,
	listen(channel,handler,lock) {
		listeners.push({channel,handler,lock})
	},
	silence(lock){
		listeners.splice(listeners.findIndex(listener=>listener.lock==lock),1)
	},
	pad(channel) {
		let channelBuffer = buf(channel)
		return b64(channelBuffer.concat(window.crypto.getRandomValues(new Uint8Array(NETWORK_SIZE-channelBuffer.length))))	
	}
}