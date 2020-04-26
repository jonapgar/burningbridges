// import {
//   str2ab,
// } from './utils.js'
// import * as conf from './conf.js'
// import PRNG from './prng.js'


// const { round, floor, random } = Math
// const {
//   MAGIC = 2147483647,
//   TOKEN = 0,
//   ESCAPE = 1,
//   FINAL = 2,
// } = conf


export { cipher, decipher }

// function generate(seed = null) {
//   // eslint-disable-next-line no-param-reassign
//   if (seed === null) seed = floor(random() * MAGIC)
//   const prng = new PRNG(seed)
//   const arr = []
//   let i = 0
//   while (i < 256) arr[i] = i++
//   const map = []
//   while (arr.length) {
//     map.push(arr.splice(round(prng.nextFloat() * arr.length), 1)[0])
//   }
//   return { map, seed }
// }


function cipher(buffer) {
  return buffer

  // let { map, seed } = generate()
  // const p = 1 / 16 // at most 1 in 16 bytes is cipher token
  // const jumbled = []
  // const len = buffer.length
  // let last = 0
  // let calc = true
  // for (let i = 0; i < len; i++) {
  //   const byte = buffer[i]
  //   const mapped = map[byte]
  //   if (mapped === ESCAPE || mapped === TOKEN || mapped === FINAL) jumbled.push(ESCAPE, mapped)
  //   else {
  //     jumbled.push(mapped)
  //   }
  //   if (random() < p) {
  //     const n = jumbled.push(TOKEN) - 1
  //     if (calc) {
  //       seed -= n - last
  //       if (seed < 0) seed = MAGIC - seed
  //     }
  //     last = n
  //     calc = !calc
  //   }
  // }

  // jumbled.push(FINAL,
  //   (seed & 0xff000000) >> 24,
  //   (seed & 0x00ff0000) >> 16,
  //   (seed & 0x0000ff00) >> 8,
  //   (seed & 0x000000ff))
  // return str2ab(Uint8Array.from(jumbled).buffer)
}

function decipher(buffer) {
  return buffer

  // const unjumbled = []
  // let seed = 0
  // let last = 0
  // const len = buffer.length
  // let calc = true
  // for (let i = 0; i < len; i++) {
  //   let byte = buffer[i]
  //   if (byte === ESCAPE) {
  //     i++
  //     byte = buffer[i]
  //     unjumbled.push(byte)
  //     continue
  //   }
  //   if (byte === TOKEN) {
  //     if (calc) {
  //       seed += i - last
  //       if (seed > MAGIC) seed -= MAGIC
  //     }

  //     last = i
  //     calc = !calc

  //     continue
  //   }
  //   if (byte === FINAL) {
  //     seed += buffer.readUInt32BE(i + 1)
  //     break
  //   }
  //   unjumbled.push(byte)
  // }

  // const { map } = generate(seed)
  // const arr = new Array(map.length)
  // // flip
  // map.forEach((m, i) => arr[m] = i)


  // const buf = new ArrayBuffer(unjumbled.length)
  // const a = new Uint16Array(buf)
  // for (const v in unjumbled) {
  //   a[v] = map[unjumbled[v]]
  // }

  // return buf
}
