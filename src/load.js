import * as crypto from './crypto.js'
import { str2ab, ab2str, buf } from './utils.js'
// eslint-disable-next-line import/no-cycle
import { load as loadContact, contacts } from './contacts.js'

const { subtle } = window.crypto
let loaded

export default load

function load(data, passphrase) {
  // eslint-disable-next-line no-return-assign
  return data ? (loaded = ondata(data, passphrase)) : (loaded || Promise.reject(new Error('Not logged in')))
}
async function ondata(data, passphrase) {
  const salt = buf(data.salt)
  const passphraseKey = await crypto.getPassphraseKey(str2ab(passphrase), salt)
  const cleartext = ab2str(await subtle.decrypt({
    name: 'AES-CBC',
    iv: buf(data.iv),
  },
  passphraseKey, buf(data.ciphertext)))
  data = JSON.parse(cleartext)
  data.contacts.forEach(contact => contact.name && loadContact(contact.name, contact))
  return {
    ...data,
    passphraseKey,
  }
}
