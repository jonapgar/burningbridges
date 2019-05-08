//encode.js
import * as conf from './conf.js'
import thing from './thing.js'
const {
	SMOOTHING = 0.5
} = conf

import LPF from 'lpf'

LPF.smoothing = SMOOTHING

const $ = thing({ 
		
	lowpass(vectors){

		let dimensions = Object.keys(vectors[0])
		let smooth = {}
		for (let d of dimensions) {
			smooth[d] = LPF.smoothArray(vectors.map(v=>v[d]))	
		}

		let ret = []
		for (let i=0;i<vectors.length;i++){
			let v = {}
			for (let d of dimensions) {
				v[d] = smooth[d][i]
			}
			ret.push(v)
		}
		return ret
	},
	trim, //
	
})
function encode(vectors){
	return 
		$(vectors)
		.fill()
		.trim()
		.lowpass()
}
module.exports = encode
