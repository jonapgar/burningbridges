//pair.js
const {
	MOTION_THRESHOLD=10,
	MOVES_THRESHOLD=10,
	MOVE_INTERVAL=10,
	PHRASE_LENGTH=16,
	NETWORK_SIZE = 10,
	HANDSHAKE_OBSCURITY=0
} = require('./conf')

const contacts = require('./contacts')
const {send,receive} = require('./handshake')
const avg=arr=>arr.reduce((a,v)=>a+v,0)
const mag=({x,y,z})=>x+y+z
const Garbage = require('./garbage')
const crypto = require('./crypto')
const $ = require('./thing')({ 
	
	...Garbage,
	...require('./advertise'),
	...require('./torrent'),
	...require('./cipher'),
	stringify: JSON.stringify, 
	parse: JSON.parse, 
	
})
const pair=name=>{
	
	return new Promise((res,rej)=>{
		window.addEventListener('devicemotion',motion,true)
		let started=false
		const moves=[]
		const motion=e=>{
			let {x,y,z} = e.accelerationIncludingGravity
			let vector = {x,y,z}
			moves.push({x,y,z})	
			if (!started && moves.length > MOVES_THRESHOLD && avg(moves.slice(-MOVES_THRESHOLD).map(mag))>MOTION_THRESHOLD){
				started=moves.length
			} else if (started && moves.length%MOVE_INTERVAL===0) {
				
				window.removeEventListener('devicemotion',motion,true)

				let code = encode(moves.slice(started-1))
				let [channel, phrase] = split(code,Math.min(NETWORK_SIZE-HANDSHAKE_OBSCURITY,code.length-PHRASE_LENGTH))
				let phraseBuffer = Buffer.from(phrase)
				let {sign,sign_iv,decrypt,decrypt_iv} = await send(b64(channel),phraseBuffer)
				let {encrypt,verify,channel:nextChannel} = await receive(channel,phraseBuffer)
				contacts(name,{channel:nextChannel,name,keys:{sign,sign_iv,decrypt,decrypt_iv,encrypt,verify}})
				return
			}
		}
	})
}



module.exports=pair