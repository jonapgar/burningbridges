const PRNG = require('./prng.js')
const {round} = Math

const {
	MAGIC = 2147483647,
	TOKEN =0,
 	ESCAPE=1,
 	FINAL=2,
} = require('./conf')



module.exports = {cipher,decipher}

function generate(seed=null){
	if (seed===null)
		seed = floor(random()*MAGIC)
	let prng = new PRNG(seed)	
	let arr = []
	let i=0
	while(i<256)
		arr[i] = i++
	let map = []
	while (arr.length) {  
	   map.push(arr.splice(round(prng.nextFloat()*arr.length), 1)[0])
	}
	return {map,seed}
}


function cipher(buffer) {
	let {map,seed} = generate()
	let p = 1/16 //at most 1 in 16 bytes is cipher token
	let jumbled = []
	let len = buffer.length
	let last=0
	for (let i=0;i<len;i++) {
		let byte = buffer[i]
		let mapped = map[byte]
		if (mapped===ESCAPE || mapped === TOKEN || mapped===FINAL) 
			jumbled.push(ESCAPE,mapped)
		else {
			jumbled.push(mapped)
		}
		if (random() < p) {
			let n = jumbled.push(TOKEN)-1
			seed-=n-last
			last=n
			if (seed<0)
				seed = MAGIC-seed
			
		}
	}
	
	jumbled.push(FINAL,
         (seed & 0xff000000) >> 24,
         (seed & 0x00ff0000) >> 16,
         (seed & 0x0000ff00) >> 8,
         (seed & 0x000000ff)
    )
	return Buffer.from(Uint8Array.from(jumbled).buffer)
}

function decipher(buffer) {
	let unjumbled = []
	let seed = 0 
	let last=0
	let len = buffer.length
	for (let i=0;i<len;i++) {
		let byte = buffer[i]
		if (byte===ESCAPE) {
			i++
			byte = buffer[i]
			unjumbled.push(byte)
			continue 
		}
		if (byte===TOKEN) {
			seed+=i-last
			last=i
			if (seed > MAGIC)
				seed-=MAGIC
			continue
		}
		if (byte===FINAL) {
			seed+=buffer.readUInt32BE(i+1)
			break
		}
		unjumbled.push(byte)
	}
	
	let {map} = generate(seed)
	let arr = new Array(map.length)
	//flip
	map.forEach((m,i)=>arr[m]=i)

	return Buffer.from(Uint8Array.from(unjumbled.map(byte=>map[byte])))
}