// channels.js
import * as conf from './conf.js'
import { random } from './crypto.js'
import {
  b64, concat,
} from './utils.js'
import ipfs from './ipfs.js'


export {
  generate, listen, silence, pad, announce,
}
const {
  NETWORK_SIZE = 16,
  IPFS_PREFIX = 'burningbridges.',
} = conf

let listeners = []
const announced = []


function generate(obscurity = 1) {
  return b64(random(Math.max(1, NETWORK_SIZE - obscurity)))
}

async function listen(channels, fn, lock) {
  if (!(channels instanceof Array)) channels = [channels]
  for (const channel of channels) {
    const subscription = IPFS_PREFIX + channel
    const handler = hash => {
      if (announced.includes(hash)) {
        console.error('ignore reflection')
        return
      }
      fn({ hash, channel, lock })
    }
    const node = await ipfs()
    node.pubsub.subscribe(subscription, handler, { discover: true })
    listeners.push({ subscription, handler, lock })
  }
}
async function silence(lock) {
  const stay = []
  const node = await ipfs()
  for (const listener of listeners) {
    if (listener.lock === lock) {
      node.pubsub.unsubscribe(listener.subscription, listener.handler)
    } else {
      stay.push(listener)
    }
  }
  listeners = stay
}

async function announce(hash, channel) {
  const subscription = IPFS_PREFIX + channel
  // just pretend utf8 for now...
  const node = await ipfs()
  announced.push(hash) // could in theory keep announced list, best to hash them again though for privacy
  node.pubsub.publish(subscription, hash)
}
function pad(channel) {
  return b64(concat(channel, random(NETWORK_SIZE - channel.length)))
}
