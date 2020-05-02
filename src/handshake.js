// handshake.js
// import profile from './load.js'
import {
  str2ab, ab2str, b64, b58,
} from './utils.js'

// eslint-disable-next-line import/no-cycle
import load from './load.js'

import { generate as generateChannel, listen, silence } from './channels.js'

import {
  chop, unify, pad, trim,
} from './garbage.js'
import { cipher, decipher } from './cipher.js'
import * as crypto from './crypto.js'

import { upload, download } from './transfer.js'

import * as conf from './conf.js'

const {
  BLOCK_SIZE = 1024,
  BLOCK_COUNT = 1024,
  OBSCURITIES = [0, 1, 2, 4, 8],
} = conf
const { subtle } = window.crypto

export { send, receive }

async function generate() {
  const { passphraseKey } = await load()

  const keys = {

    ...await crypto.exportSignVerify(passphraseKey),
    ...await crypto.generateExchange(),
  }
  const encodedKeys = {
    signKey: b64(keys.signKey),
    signIv: b64(keys.signIv),
    verifyKey: b64(keys.verifyKey),
    publicKey: b64(await subtle.exportKey('spki', keys.publicKey)),
    privateKey: b64(await subtle.exportKey('pkcs8', keys.privateKey)),
  }

  return encodedKeys
}


async function send(channel, phrase) {
  const encodedKeys = await generate()
  const { verifyKey, publicKey } = encodedKeys
  const handshakeKey = await crypto.getPassphraseKey(phrase, phrase)
  const myChannels = OBSCURITIES.map(generateChannel)
  const payload = JSON.stringify({
    name: (await load()).profile.name, channels: myChannels, encodedKeys: { verifyKey, publicKey },
  })
  const buffer = unify(chop(pad(str2ab(payload), BLOCK_SIZE), BLOCK_COUNT).map(block => pad(block, BLOCK_SIZE)))
  const encrypted = await subtle.encrypt({
    name: 'AES-CBC',
    iv: phrase,
  },
  handshakeKey,
  buffer)
  const hash = await upload(cipher(encrypted))

  return { encodedKeys, hash, channels: myChannels }
}

function receive(channel, phrase, lock) {
  return new Promise(res => {
    listen(b58(channel), ({ hash }) => {
      handler(hash).catch(err => console.log(err)) // nbd
    }, lock)
    async function handler(hash) {
      if (hash === lock.hash) {
        throw new Error(`Saw reflection ${hash}.`)
      }
      const buffer = decipher(await download(hash))
      const decrypted = await subtle.decrypt({
        name: 'AES-CBC',
        iv: phrase,
      },
      await crypto.getPassphraseKey(phrase, phrase),
      buffer)
      const payload = JSON.parse(ab2str(trim(unify(chop(decrypted, BLOCK_COUNT).map(trim)))))
      res(payload)
      silence(lock)
    }
  })
}
