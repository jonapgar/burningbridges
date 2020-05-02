// eslint-env nodejs
const WebSocket = require('ws')

const [,, port = 3000, multiaddr = '/ip4/127.0.0.1/tcp/5001'] = process.argv
const ipfs = require('ipfs-http-client')(multiaddr)

const wss = new WebSocket.Server({
  port,
})
wss.on('connection', socket => {
  let queue = []
  function next(i = 0) {
    return new Promise(resolve => {
      queue[i] = resolve
    })
  }

  function handler(event) {
    // eslint-disable-next-line no-return-assign
    return async response => {
      if (response.data) {
        socket.send(
          JSON.stringify({ event, response: response.data.toString('utf8') }),
        )
      }
    }
  }
  async function cmd(command, args) {
    let response
    try {
      response = await command.split('.').reduce((a, p) => a[p], ipfs)(...args)
      if (response && typeof response.next === 'function') {
        response = (await response.next()).value
      }
    } catch (e) {
      console.error(e)
    }
    return response
  }
  socket.onmessage = async ({ data }) => {
    if (queue.length) {
      queue.shift()(data)
    } else {
      // eslint-disable-next-line no-param-reassign
      data = JSON.parse(data.toString('utf8'))
      const { index, command } = data
      let { args } = data
      queue = []
      args = await Promise.all(
        args.map(arg => (arg instanceof Array ? next(arg[0]) : arg)),
      )
      switch (command) {
        case 'get': {
          socket.send(JSON.stringify({ index, command, next: true }))
          const { value: { _bufs: [buffer] } } = await (
            await (
              await ipfs.get(...args)
            ).next()
          ).value.content.next()
          socket.send(buffer)
        } break
        case 'pubsub.subscribe':
        case 'pubsub.unsubscribe':
          args.splice(1, 0, handler(args[0]))
        // eslint-disable-next-line no-fallthrough
        default:
          socket.send(
            JSON.stringify({
              index,
              command,
              response: await cmd(command, args),
            }),
          )
          break
      }
    }
  }
  socket.onclose = event => {
    if (event.wasClean) {
      console.log(
        `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`,
      )
    } else {
      // e.g. server process killed or network down
      // event.code is usually 1006 in this case
      console.error('[close] Connection died')
    }
  }

  socket.onerror = error => {
    console.error(`[error] ${error.message}`)
  }
})
