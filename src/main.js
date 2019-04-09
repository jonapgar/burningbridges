//main.js
const {send} = require('./core')

const profile = require('./profile')
const io = require('./io')
const save = require('./save')
const contacts = require('./contacts')
const pair = require('./pair')

window.io = io

let input = document.getElementById('input')
let fileInput = document.getElementById('file')
let chat = document.getElementById('chat')
let container = document.getElementById('chat-container')

input.onchange = async e=>{
	let name = (await profile).name
	let message = input.value
	let space = message.indexOf(' ')
	let them = message.substring(0,space)
	let contact = await contacts(them)
	if (!contact) {
		await pair(them)
		contact = await contacts(them)
	}
	message = message.substring(space+1)
	append(`${name} => @${them} ${message}`,'message me')
	send('message',{text:message,recipient:them})	
}

let loaded=false
input.onclick = e=>{
	if (loaded)
		return

	fileInput.click()
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
      

      io.trigger('login:data',data)
      loaded=true

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
		setTimeout(save,500)
		e.preventDefault()
		return e.returnValue = 'Save your file before leaving?'
	}	
	
}