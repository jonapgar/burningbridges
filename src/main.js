import save from './save.js'
import load from './load.js';
import * as conf from './conf.js'
import {write,start as startConsole} from './console.js'
import contacts from './contacts.js'
import {askPassword} from './questions.js'
import * as  io from './io.js'
const input = document.getElementById('input')
const log = document.getElementById('log')
startConsole({input,log})


io.on('received',async ({message,name})=>{
	write(`${name}: ${message}`)
})



const {
	LOCAL_STORAGE='burningbridges' + window.location.hash
} = conf


window.onbeforeunload = e=>{
	if (window._dirty) {
		setTimeout(()=>{
			save(null,askPassword())
		},500)
		e.preventDefault()
		return e.returnValue = 'Save your file before leaving?'
	}	
}
if (LOCAL_STORAGE) {
	let local = window.localStorage.getItem(LOCAL_STORAGE)
	if (local) {
		askPassword().then(async passphrase=>{
			let {contacts:c,profile} = await load({data:JSON.parse(local),passphrase})
			write(`Welcome back ${profile.name}`)
			c.forEach(c=>contacts(c.name)) //primes contacts
		})
	}
}

	