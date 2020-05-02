// core.js

import { concat, buf, b64 } from './utils.js'

import { announce } from './channels.js'
// eslint-disable-next-line import/no-cycle
import { load as loadContact, lookup as lookupContactsByChannel } from './contacts.js'

import {
  chop, unify, pad, trim,
} from './garbage.js'
import {
  sign, encrypt, decrypt, getSecretKey, generateExchange, verify, importTheirPublicExchangeKey,
} from './crypto.js'
import { cipher, decipher } from './cipher.js'
import { upload, download } from './transfer.js'


import * as conf from './conf.js'

const { subtle } = window.crypto

const {
  BLOCK_SIZE = 1024,
  BLOCK_COUNT = 1024,
  SIGNATURE_LENGTH = 64,
  PUBLICKEY_LENGTH = 91,

} = conf


export { send, receive }


async function send({ buffer, contact, obscurity = 0 }) {
  // eslint-disable-next-line no-param-reassign
  if (typeof contact === 'string') contact = await loadContact(contact)
  const channel = contact.theirChannels[obscurity]
  // eslint-disable-next-line no-param-reassign
  buffer = unify(chop(pad(buffer, BLOCK_SIZE), BLOCK_COUNT).map(block => pad(block, BLOCK_SIZE)))
  const { publicKey, privateKey } = await generateExchange()
  const myPublicKeyBuffer = await subtle.exportKey('spki', publicKey)
  const myPublicKey = b64(myPublicKeyBuffer)
  contact.encodedKeys.myPrivateKeys.push({
    myPrivateKey: b64(await subtle.exportKey('pkcs8', privateKey)),
    myPublicKey, // string for comparison later
  })
  contact.realKeys.myPrivateKeys.push({
    myPrivateKey: privateKey,
    myPublicKeyBuffer,
  })

  const ciphertext = await encrypt(
    buffer,
    await getSecretKey({ theirPublicKey: contact.realKeys.theirPublicKey, myPrivateKey: privateKey }),
  )
  const theirPublicKeyBuffer = buf(contact.encodedKeys.theirPublicKey)
  const data = concat(myPublicKeyBuffer, theirPublicKeyBuffer, ciphertext)
  const signature = await sign(data, contact.realKeys.mySignKey)
  // eslint-disable-next-line no-param-reassign
  buffer = cipher(concat(signature, data))
  const path = await upload(buffer)
  await announce(path, channel)
}

const seen = {}
async function receive({ channel, hash }, tap) {
  if (hash in seen) { return }
  seen[hash] = true // todo remove

  let buffer = decipher(await download(hash))
  let error
  for (let contact of await lookupContactsByChannel(channel)) {
    let decrypted
    contact = await loadContact(contact.name)
    try {
      let i = 0
      const signature = buffer.slice(i, i += SIGNATURE_LENGTH)
      const data = buffer.slice(i)
      await verify(signature, data, contact.realKeys.theirVerifyKey)
      const theirPublicKeyBuffer = buffer.slice(i, i += PUBLICKEY_LENGTH)
      const myPublicKeyBuffer = buffer.slice(i, i += PUBLICKEY_LENGTH)
      const ciphertext = buffer.slice(i)


      const keyIndex = contact.realKeys.myPrivateKeys.findIndex(kp => b64(myPublicKeyBuffer) === b64(kp.myPublicKeyBuffer)) // todo compare as buffers...

      if (keyIndex === -1) {
        throw new Error('Missing corresponding privateKey')
      }
      const { myPrivateKey } = contact.realKeys.myPrivateKeys[keyIndex]

      const theirPublicKey = contact.realKeys.theirPublicKey = await importTheirPublicExchangeKey(theirPublicKeyBuffer)
      contact.realKeys.myPrivateKeys = contact.realKeys.myPrivateKeys.slice(keyIndex)
      contact.encodedKeys.myPrivateKeys = contact.encodedKeys.myPrivateKeys.slice(keyIndex)
      contact.encodedKeys.theirPublicKey = b64(theirPublicKeyBuffer)
      decrypted = await decrypt(ciphertext,
        await getSecretKey({ theirPublicKey, myPrivateKey }))
    } catch (e) {
      error = e
      continue
    }
    buffer = trim(unify(chop(decrypted, BLOCK_COUNT).map(trim)))
    tap(buffer)
    return
  }
  console.error(error || `No contacts for channel ${channel}`)
}
