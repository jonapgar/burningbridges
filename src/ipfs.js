
import * as conf from './conf.js'

const {
  HOST = '127.0.0.1:3000',
} = conf
export { ipfs as default }

let promise
function ipfs() {
  // eslint-disable-next-line no-return-assign
  return promise = promise || connect()
}
async function connect() {
  const subscriptions = []
  const queue = {}
  const socket = new WebSocket(`ws://${HOST}`)
  let incoming
  const connecting = new Promise(resolve => {
    socket.onopen = () => {
      resolve()
    }
  })

  socket.onmessage = ({ data }) => {
    if (incoming) {
      incoming(data)
      incoming = null
    } else {
      const {
        index, response, next, event,
      } = JSON.parse(data)
      if (index in queue) {
        if (next) incoming = queue[index]
        else queue[index](response)
      }
      if (event) {
        subscriptions.forEach(({ event: e, handler }) => event === e && handler(response))
      }
    }
  }
  socket.onclose = event => {
    promise = null
    if (event.wasClean) {
      console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`)
    } else {
      // e.g. server process killed or network down
      // event.code is usually 1006 in this case
      console.error('[close] Connection died')
    }
  }

  socket.onerror = error => {
    console.error(`[error] ${error.message}`)
  }

  let index = 0
  const wait = () => {
    const i = index
    return new Promise(resolve => {
      queue[i] = response => {
        delete queue[i]
        resolve(response)
      }
    })
  }

  await connecting

  return {
    pin: {
      rm(hash) {
        index++
        socket.send(JSON.stringify({
          index,
          command: 'pin.rm',
          args: [hash],
        }))
        return wait()
      },
    },
    pubsub: {
      publish(event, data) {
        index++
        socket.send(JSON.stringify({
          index,
          command: 'pubsub.publish',
          args: [event, []],
        }))
        socket.send(data)
        return wait()
      },
      subscribe(event, handler, options) {
        subscriptions.push({
          event, handler, options,
        })
        index++
        socket.send(JSON.stringify({
          index,
          command: 'pubsub.subscribe',
          args: [event, options],
        }))
      },
      unsubscribe(event, handler) {
        const i = subscriptions.findIndex(subscription => subscription.event === event && (!handler || subscription.handler === handler))
        if (i) {
          index++
          socket.send(JSON.stringify({
            index,
            command: 'pubsub.unsubscribe',
            args: [event],
          }))
          return subscriptions.splice(i, 1)[0]
        }
        return null
      },
    },
    add(buffer) {
      index++
      socket.send(JSON.stringify({
        index,
        incoming: true,
        command: 'add',
        args: [[]],
      }))
      socket.send(buffer)
      return wait()
    },
    get(path) {
      index++
      socket.send(JSON.stringify({
        index,
        command: 'get',
        args: [path],
      }))
      return wait().then(blob => blob.arrayBuffer())
    },
  }
}
