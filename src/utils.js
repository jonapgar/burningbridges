const utils = module.exports = {
	b64(buf){
		return (Buffer.isBuffer(buf) ? buf:Buffer.from(buf)).toString('base64')
	},
	buf(b64){
		return Buffer.from(b64,'base64')
	},
}