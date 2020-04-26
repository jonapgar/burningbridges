import * as io from './io.js'
import { askPassword } from './questions.js'
import save from './save.js'
import load from './load.js'
import * as conf from './conf.js'
import { write, start as startConsole } from './console.js'
import { execute } from './commands.js'

const {
  LOCAL_STORAGE = `burningbridges${window.location.hash}`,
} = conf

const input = document.getElementById('input')
const log = document.getElementById('log')

startConsole({ input, log, execute })

io.on('message', ({ message, name }) => {
  write(`${name}: ${message}`)
})

window.onbeforeunload = e => {
  if (window._dirty) {
    setTimeout(() => {
      save(null, askPassword())
    }, 500)
    e.preventDefault()
    return e.returnValue = 'Save your file before leaving?'
  }
}
if (LOCAL_STORAGE) {
  const local = window.localStorage.getItem(LOCAL_STORAGE)
  if (local) {
    askPassword().then(async passphrase => {
      const { profile } = await load(JSON.parse(local), passphrase)
      write(`Hello ${profile.name}.`)
    })
  }
}
