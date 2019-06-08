import {Buffer,getNode as ipfs} from './ipfs.js'
import {announce} from './channels.js'
import * as conf from './conf.js'

export {upload,download}

const options = conf.ipfs && conf.ipfs.add
async function upload(buffer) {
	let node = await ipfs()
	let [file] = await node.add(Buffer.from(buffer),options)
	let {hash} = file
	return hash
}
async function download(path) {
	let node = await ipfs()
	let [file] = await node.get(path)
	
	if (!file)
		throw new Error(`NO file at path ${file}`)
	return file.content
}
