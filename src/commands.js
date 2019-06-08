import _load from './load.js';
import _save from './save.js'
import contacts from './contacts.js'
import _pair from './pair.js'
import {send} from './core.js'
import {buf} from './utils.js'
import {askPassword, bridgeOfDeath } from './questions.js';
const commands = {bb,help,load,generate,save,pair,python}
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
bb.help ='Sends a message'
async function bb(them_msg){
	let [them,message] = them_msg.split(/\s+/,2)
	let contact = await contacts(them)
	if (!contact)
		throw new Error(`You don't know ${them}, try "pair"`)

	return send({text:message,contact})			
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
	let {profile} = await _load({data,passphrase:await askPassword()})
	return `Hello ${profile.name}.`
}
generate.help = 'Generates a key file'
async function generate(name){
	let passphrase = await askPassword()
	
	await _load({data:await _save({profile:{name},contacts:[]},passphrase),passphrase})
	return `Your profile has been generated ${name}.`
	
}
save.help = 'Saves your stuff'
async function save(){
	
	let passphrase = await askPassword()
	await _load({data:await _save(null,passphrase),passphrase})
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


