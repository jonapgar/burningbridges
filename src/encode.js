// // encode.js
// import LPF from 'lpf'
// import * as conf from './conf.js'


// const {
//   SMOOTHING = 0.5,
// } = conf

// LPF.smoothing = SMOOTHING


// function lowpass(vectors) {
//   const dimensions = Object.keys(vectors[0])
//   const smooth = {}
//   for (const d of dimensions) {
//     smooth[d] = LPF.smoothArray(vectors.map(v => v[d]))
//   }

//   const ret = []
//   for (let i = 0; i < vectors.length; i++) {
//     const v = {}
//     for (const d of dimensions) {
//       v[d] = smooth[d][i]
//     }
//     ret.push(v)
//   }
//   return ret
// }
// function encode(vectors) {
//   return lowpass(trim(fill(vectors)))
// }
// module.exports = encode
