
export {
  split, b64, b58, buf, ab2str, str2ab, concat,
}

function concat(...buffers) {
  let length = 0

  for (const buffer of buffers) {
    length += buffer.byteLength
  }
  const joined = new Uint8Array(length)
  let offset = 0
  for (const buffer of buffers) {
    joined.set(new Uint8Array(buffer), offset)
    offset += buffer.byteLength
  }

  return joined.buffer
}
function ab2b64(buffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

// base-x encoding / decoding
// Copyright (c) 2018 base-x contributors
// Copyright (c) 2014-2018 The Bitcoin Core developers (base58.cpp)
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
if (ALPHABET.length >= 255) throw new TypeError('Alphabet too long')

const BASE_MAP = new Uint8Array(256)
BASE_MAP.fill(255)

for (let i = 0; i < ALPHABET.length; i++) {
  const x = ALPHABET.charAt(i)
  const xc = x.charCodeAt(0)

  if (BASE_MAP[xc] !== 255) throw new TypeError(`${x} is ambiguous`)
  BASE_MAP[xc] = i
}

const BASE = ALPHABET.length
const LEADER = ALPHABET.charAt(0)
const iFACTOR = Math.log(256) / Math.log(BASE) // log(256) / log(BASE), rounded up

function ab2b58(buffer) {
  const source = new Uint8Array(buffer)
  if (source.length === 0) return ''

  // Skip & count leading zeroes.
  let zeroes = 0
  let length = 0
  let pbegin = 0
  const pend = source.length

  while (pbegin !== pend && source[pbegin] === 0) {
    pbegin++
    zeroes++
  }

  // Allocate enough space in big-endian base58 representation.
  const size = ((pend - pbegin) * iFACTOR + 1) >>> 0
  const b58 = new Uint8Array(size)

  // Process the bytes.
  while (pbegin !== pend) {
    let carry = source[pbegin]

    // Apply "b58 = b58 * 256 + ch".
    let i = 0
    for (let it = size - 1; (carry !== 0 || i < length) && (it !== -1); it--, i++) {
      carry += (256 * b58[it]) >>> 0
      b58[it] = (carry % BASE) >>> 0
      carry = (carry / BASE) >>> 0
    }

    if (carry !== 0) throw new Error('Non-zero carry')
    length = i
    pbegin++
  }

  // Skip leading zeroes in base58 result.
  let it = size - length
  while (it !== size && b58[it] === 0) {
    it++
  }

  // Translate the result into a string.
  let str = LEADER.repeat(zeroes)
  for (; it < size; ++it) str += ALPHABET.charAt(b58[it])

  return str
}
function buf(base64) {
  const binary_string = window.atob(base64)
  const len = binary_string.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i)
  }
  return bytes.buffer
}

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf))
}
function str2ab(str) {
  const buf = new ArrayBuffer(str.length * 2) // 2 bytes for each char
  const bufView = new Uint16Array(buf)
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}
function b64(buf) {
  if (buf.buffer && (buf.buffer instanceof ArrayBuffer)) return ab2b64(buf.buffer)
  return ab2b64(buf)
}

function b58(buf) {
  if (buf.buffer && (buf.buffer instanceof ArrayBuffer)) return ab2b58(buf.buffer)
  return ab2b58(buf)
}
function split(arr, p) {
  return [arr.slice(0, p), arr.slice(p)]
}
