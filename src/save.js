// save.js
import * as crypto from './crypto.js'
import { contacts } from './contacts.js'
import { str2ab, buf, b64 } from './utils.js'
import * as conf from './conf.js'
import load from './load.js'

const {
  LOCAL_STORAGE = `burningbridges${window.location.hash}`,
} = conf
const { subtle } = window.crypto

export default async function save(data, passphrase) {
  if (data) {
    //
  } else {
    // eslint-disable-next-line no-param-reassign
    data = await load()
    data.contacts = contacts.map(contact => {
      const {
        name, myChannels, theirChannels, encodedKeys,
      } = contact
      return {
        name, myChannels, theirChannels, encodedKeys,
      }
    })
  }


  const salt = data.salt = data.salt || b64(crypto.random())
  const passphraseKey = await crypto.getPassphraseKey(str2ab(passphrase), buf(salt))


  const iv = crypto.random()
  const encrypted = {
    iv: b64(iv),
    salt,
    ciphertext: b64(await subtle.encrypt({
      name: 'AES-CBC',
      iv,
    },
    passphraseKey,
    str2ab(JSON.stringify(data)))),
  }
  const json = JSON.stringify(encrypted)
  if (LOCAL_STORAGE) {
    window.localStorage.setItem(LOCAL_STORAGE, json)
  }
  const download = document.createElement('a')
  download.href = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`
  download.setAttribute('download', 'keys.json')
  document.body.appendChild(download)
  download.click()
  download.remove()

  window._dirty = false
  return encrypted
}
