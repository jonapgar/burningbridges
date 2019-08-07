import _load from './load.js';
import _save from './save.js'
import {load as loadContact,unload as unloadContact,contacts as _contacts} from './contacts.js'
import _pair from './pair.js'
import {send} from './core.js'
import {buf,split,str2ab} from './utils.js'

import {askPassword, bridgeOfDeath } from './questions.js';
import ask from './ask.js';
const commands = {bb,help,load,generate,save,pair,python,broker,rename,forget,contacts}
export {execute,commands}

async function execute(statement) {
	let space = statement.indexOf(' ') //todo whitespace
	if (space===-1) space = statement.length
	let command = statement.substring(0,space)
	if (!command) 
		return
	else if (command in commands)
		return commands[command](statement.substring(space).trim())
	
	throw unrecognize(command)
}
function unrecognize(command){
	return new Error(`Unrecognized command: ${command}`)

}
contacts.help = 'List contacts'
async function contacts(){
	return _contacts.map(({name})=>name).join('\n')
}
bb.help ='Sends a message'
async function bb(them_msg){
	let [them,message] = split(them_msg,them_msg.indexOf(' '))
	let contact = await loadContact(them)
	if (!contact)
		throw new Error(`You don't know ${them}, try "pair"`)

	return send({buffer:str2ab(JSON.stringify({message})),contact})			
}
broker.help = "Brokers an introduction between two contacts"
async function broker(a_b){
	let [a,b] = await Promise.all(a_b.split(/\s+/,2).map(them=>{
		let contact = loadContact(them)
		if (!contact) 
			throw new Error(`You don't know ${them}, try "pair"`)
		return contact
	}))
	
	function intro(contact){
		let {theirPublicKey} = contact.encodedKeys
		return str2ab(JSON.stringify({intro:{name,theirPublicKey}}))
	}

	send({buffer:await intro(a),contact:a})
	send({buffer:await intro(b),contact:a})
}

rename.help='Renames a contact'
async function rename(a_b){
	let [from,to] = a_b.split(/\s+/,2)
	let [contact,existing] = await Promise.all([from,to].map(loadContact))
	if (!contact)
		throw new Error(`You cannot rename ${from}. You don't know them.`)
	if (existing)
		throw new Error(`You already know someone called ${to}. Try another name.`)
	contact.name = to
	await save()
	return `Henceforth ${from} will be forever known as ${to}.` 
}

forget.help = 'Forget a user forever'
async function forget(them) {
	let contact = await loadContact(them)
	if (!contact)
		throw new Error(`You cannot forget ${them}. You don't know them`)
	if (!/^\s*y(es)\s*$/i.test(await ask(`Are you sure you want to forget about ${them}. This cannot be undone!`))) {
		throw new Error(`Not forgetting $[them}. Type "y" or "yes" to confirm deletion.`)
	}
	unloadContact(them)
	await save()
	return `${them} has been forgotten`
}


help.help = 'Gives help'
function help(command){
	if (!command) {
		return Object.keys(commands).map(commands.help).join('\n')
	} else if (!(command in commands)) {
		throw unrecognize(command)
	}
	return `${command}: ${commands[command].help}`
}

load.help = 'Loads your stuff'
async function load(){
	let data = await new Promise(resolve=>{

		let fileInput = document.createElement('input')
		fileInput.className = 'invisible'
		fileInput.type = 'file'
		document.body.appendChild(fileInput)
		fileInput.onchange = e=>{
			document.body.removeChild(fileInput)
			let reader = new FileReader()
			reader.onload = async function(){
				//TODO decrypt encrypted json files using password
				let data = JSON.parse(reader.result)
				resolve(data)
			}
			reader.readAsText(fileInput.files[0])
		}
		fileInput.click()
	})
	let {profile,contacts:c} = await _load(data,await askPassword())
	// c.forEach(c=>loadContact(c.name)) //primes contacts
	return `Hello ${profile.name}.`
}


generate.help = 'Generates a key file'
async function generate(name){
	if (!name)
		throw new Error('You must supply a name to generate a file.')
	let passphrase = await askPassword()
	
	await _load(await _save({profile:{name},contacts:[]},passphrase),passphrase)
	return `Your profile has been generated ${name}.`
	
}

save.help = 'Saves your stuff'
async function save(){
	
	let passphrase = await askPassword()
	await _load(await _save(null,passphrase),passphrase)
	return "Your profile has been saved."
	
}

pair.help = 'Pairs with another device'
function pair(code){
	return  _pair(code ? buf(code):undefined)
}


python.help = 'Silly'
async function python(){
	let [name,color,speed] = await bridgeOfDeath()
	if (/african.*european/i.test(speed))
		return 'What? I don\'t know that!'
	else 
		throw Error('Off the bridge with ye!')
}


