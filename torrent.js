const WebTorrent = require('webtorrent')
const client = new WebTorrent()

function seed(buffer) {
	return new Promise((res,rej)=>{
		try {
			client.seed([buffer],({magnetURI})=>magnetURI)
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