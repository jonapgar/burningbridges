//pair.js
import * as conf from './conf.js'
import * as Garbage from './garbage.js'
import * as crypto from './crypto.js'
import thing from './thing.js'
import contacts from './contacts.js'
import {send,receive} from './handshake.js'
import * as cipher from './cipher.js'
import * as advertise from './advertise.js'
import * as torrent from './torrent.js'
import {str2ab,ab2str,concat,buf,b64,split} from './utils.js'

export default pair

const {
	MOTION_THRESHOLD=10,
	MOVES_THRESHOLD=10,
	MOVE_INTERVAL=10,
	PHRASE_LENGTH=16,
	NETWORK_SIZE = 10,
	HANDSHAKE_OBSCURITY=0
} = conf


const avg=arr=>arr.reduce((a,v)=>a+v,0)
const mag=({x,y,z})=>x+y+z

const $ = thing({ 
	
	...cipher,
	...Garbage,
	...advertise,
	...torrent,
	stringify: JSON.stringify, 
	parse: JSON.parse, 
	
})
async function pair(code){
	code = code || await share() //await jerk()
	console.log(`/pair ${b64(code)}`)
	let [channel, phrase] = parse(code)
	let {sign,sign_iv,decrypt,decrypt_iv} = await send(channel,phrase)
	let {encrypt,verify,channel:nextChannel,name} = await receive(channel,phrase)
	contacts(name,{channel:nextChannel,name,keys:{sign,sign_iv,decrypt,decrypt_iv,encrypt,verify}})
}

function parse(code) {
	return split(code,Math.min(NETWORK_SIZE-HANDSHAKE_OBSCURITY,code.byteLength-PHRASE_LENGTH))
}
function share(){
	return crypto.random(NETWORK_SIZE + PHRASE_LENGTH)
}


// function jerk(){

// 	return new Promise((res,rej)=>{
// 		//todo timeout call reject
// 		window.addEventListener('devicemotion',motion,true)
// 		let started=false
// 		const moves=[]
// 		let t = window.performance.now()
// 		const motion=async e=>{
// 			let {x,y,z} = e.accelerationIncludingGravity
// 			let vector = {x,y,z}
// 			t=window.performance.now()-t
// 			moves.push({x,y,z,t})	
// 			if (!started && moves.length > MOVES_THRESHOLD && avg(moves.slice(-MOVES_THRESHOLD).map(mag))>MOTION_THRESHOLD){
// 				started=moves.length
// 			} else if (started && moves.length%MOVE_INTERVAL===0) {
				
// 				window.removeEventListener('devicemotion',motion,true)

// 				let code = encode(moves.slice(started-1))
// 				res(code)
// 			}
// 		}
// 	})
// }


