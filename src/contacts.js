//load contacts
import * as crypto from './crypto.js'
import { write } from './console.js';
import {buf, b64, ab2str} from './utils.js'
import _load from './load.js'
import * as io from './io.js'
import {listen,silence} from './channels.js'
import {receive} from './core.js'
import pair from './pair.js';
import ask from './ask.js';
const contacts = []
const { subtle } = window.crypto

export {load,unload,contacts,lookup}
function load(name,details){
	
	let contact = contacts.find(contact=>contact.name===name)
	if (!contact) {
		if (details) {
			contacts.push(contact = {...details,name})
			
		}
		else
			return null
	} else if (details) {
		Object.assign(contact,details)
	}
	return prepare(contact)
}
function unload(name){
	let [contact] = contacts.splice(contacts.findIndex(contact=>contact.name===name),1)
	silence(contact)
}
function lookup(channel){
	
	return contacts.filter(contact=>contact.channels.includes(channel))
}

function announced({channel,hash,lock:contact}){
	receive({channel,hash},data=>received(data,contact))
}
async function received(buffer,contact){
	let {message,update,intro} = JSON.parse(ab2str(buffer))
	if (message) {
		io.trigger('message',{message,name:contact.name})
	} 
	if (update) {
		let {channels,encodedKeys,metadata} = update
		let {verify} = encodedKeys
		Object.assign(contact,prepare({channels,verify,metadata}))
	}
	if (intro) {
		let {theirPublicKey,name} = intro
		let confirmation = `connect with ${name}`
		let answer = await ask(`${contact.name} wants to introduce you to ${name}. If you want to connect with ${name}, type "${confirmation}"`)
		if (answer.trim()!==confirmation) {
			write(`You did not say "${confirmation}" so we will not connect you with ${name}`)
			return
		}
		write(`Ok, attempting to pair with ${name}`)
		contact.realKeys.myPrivateKeys.forEach(async myPrivateKey=>{
			let secretKeyBuffer = await subtle.exportKey('raw',crypto.getSecretKey(buf(theirPublicKey),myPrivateKey))
			pair(secretKeyBuffer)
		})
	}
}
async function prepare(contact){
	let {passphraseKey} = await _load()
	let {myPrivateKeys,theirPublicKey,theirVerifyKey,mySignKey,mySignIv} = contact.encodedKeys
	mySignKey =  crypto.importMyPrivateSigningKey(buf(mySignKey), passphraseKey, buf(mySignIv))
	myPrivateKeys =  Promise.all(myPrivateKeys.map(async ({myPrivateKey,myPublicKey})=>{
		return {
			myPrivateKey:await crypto.importMyPrivateExchangeKey(buf(myPrivateKey)),
			myPublicKeyBuffer:buf(myPublicKey)//no need toimport.
		}
	}))
	theirPublicKey =  crypto.importTheirPublicExchangeKey(buf(theirPublicKey))	
	theirVerifyKey =  crypto.importTheirPublicVerificationKey(buf(theirVerifyKey))
	let realKeys = {
		myPrivateKeys: await myPrivateKeys,
		theirPublicKey: await theirPublicKey,
		theirVerifyKey: await theirVerifyKey,
		mySignKey: await mySignKey,
	}
	
	silence(contact)
	listen(contact.channels,announced,contact)
	return {
		...contact,
		realKeys
	}
}