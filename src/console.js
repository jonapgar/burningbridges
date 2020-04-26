import * as conf from './conf.js'

export {
  start, write, submit, answer, secret,
}

const {
  HISTORY_MAX = 10,
} = conf

window.onerror = write
window.onunhandledrejection = write
let input
let log
let trap
let execute
function start({ input: i, log: l, execute: e }) {
  execute = e
  input = i
  log = l
  input.onkeydown = onkeydown
}
function answer(resolve) {
  trap = command => {
    trap = null
    resolve(command)
  }
}
function secret() {
  input.type = 'password'
}
let recentIndex = 0
const recent = []
const ENTER = 13
const ESCAPE = 27
const UP = 38
const DOWN = 40
function onkeydown(e) {
  switch (e.which) {
    case ENTER: {
      const command = input.value.trim()
      if (input.type !== 'password') {
        write(command)
        if (recentIndex > HISTORY_MAX) recent.shift()
        recentIndex = recent.push(command)
      } else {
        recentIndex = recent.length
      }
      input.value = ''

      input.type = 'text'

      submit(command).catch(err => {
        console.error(err)
        return err
      }).then(response => {
        if (response) write(response)
      })
      return
    }
    case UP:
      if (recentIndex != 0) input.value = recent[--recentIndex]
      return
    case DOWN:
      if (recentIndex < recent.length - 1) input.value = recent[++recentIndex] || ''
      return
    case ESCAPE:
      recentIndex = recent.length
      input.value = ''
  }
}
async function submit(command) {
  if (trap) {
    trap(command)
    return
  }

  command = command.trim()

  return execute(command).catch(err => {
    throw err
  })
}

function write(data) {
  const node = document.createTextNode(`${data}\n`)
  log.appendChild(node)
}
