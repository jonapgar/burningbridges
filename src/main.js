import profile from './profile.js'
import * as io from './io.js'
import save from './save.js'

import contacts from './contacts.js'
import pair from './pair.js'
import {send} from './core.js'
import * as handshake from './handshake.js'
import * as channels from './channels.js'
import {buf} from './utils.js'

window.io = io

const input = document.getElementById('input')
const fileInput = document.getElementById('file')
const chat = document.getElementById('chat')
const container = document.getElementById('chat-container')

input.onchange = async e=>{
	let message = input.value.trim()
	let space = message.indexOf(' ')
	
	if (space===-1) space = message.length
	let command = message.substring(0,space)
	message = message.substring(space+1)
	switch (command) {
		case '/load':
			return fileInput.click()
		case '/name':
			let passphrase = window.prompt('Enter your passphrase')
			return io.trigger('login:data',{data:await save({name:message,contacts:[]},passphrase),passphrase})
		case '/pair':
			return pair(buf(message))
		case '/magnet':
			return await channels.listeners.forEach(l=>l.handler(l.channel,message))
	}
	
	let them = command
	let {name:me} = await profile
	let contact = await contacts(them)
	if (!contact) {
		await pair()
		input.onchange(e)
	}
	
	append(`${me} => @${them} ${message}`,'message me')
	send('message',{text:message,recipient:them})	
}




io.on('received',async ({message,name})=>{
	let me = (await profile).name
	append(`${name} => @${me} ${message}`,'message them')
})


fileInput.onchange = e=>{
	let reader = new FileReader()
    reader.onload = async function(){
      //TODO decrypt encrypted json files using password
      let data = JSON.parse(reader.result)
      io.trigger('login:data',{data,passphrase:window.prompt('Enter your passphrase')})
    }
    reader.readAsText(fileInput.files[0])
}

function append(text,className){
	
	let el = document.createElement('div')
	el.className = className
	el.appendChild(document.createTextNode(text))
	chat.appendChild(el)
	container.scrollTop=9999999
	input.value = ''
}
let leaving = false

window.onbeforeunload = e=>{
	if (window._dirty) {
		setTimeout(()=>{
			save(null,window.prompt('Enter your passphrase'))
		},500)
		e.preventDefault()
		return e.returnValue = 'Save your file before leaving?'
	}	
	
}