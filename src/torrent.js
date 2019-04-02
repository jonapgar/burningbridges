const WebTorrent = require('webtorrent')
const client = new WebTorrent()
const {
	TORRENT_DEFAULT_OPTIONS={},
} = require('./conf')

module.exports = {seed,download}

function seed(buffer,options={}) {
	return new Promise((res,rej)=>{
		options = {
			...TORRENT_DEFAULT_OPTIONS,
			...options
		}
		try {
			client.seed([Buffer.from(buffer)],options,({magnetURI})=>res(magnetURI))
		} catch (e) {
			rej(e)
		}
	})
}

function download(magnetURI) {
	return new Promise((res,rej)=>{
		try {
			client.add(magnetURI,res)
		} catch (e) {
			rej(e)
		}
	})
}

