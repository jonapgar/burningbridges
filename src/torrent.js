import {str2ab,ab2str,concat,buf,b64} from './utils.js'
import * as conf from './conf.js'
import * as WebTorrentStub from '/node_modules/webtorrent/webtorrent.debug.js' //provides window.WebTorrent
export {seed,download}

const client = new window.WebTorrent()
const {
	TORRENT_DEFAULT_OPTIONS={},
} = conf



function seed(buffer,options={}) {
	return new Promise((res,rej)=>{
		options = {
			...TORRENT_DEFAULT_OPTIONS,
			...options
		}
		try {
			client.seed([new Blob([buffer],{type: 'application/json'})],options,({magnetURI})=>res(magnetURI))
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

