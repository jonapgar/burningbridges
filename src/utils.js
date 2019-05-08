
export { split,b64, buf, ab2str, str2ab,concat}

function concat() {
	var length = 0
	var buffer = null

	for (var i in arguments) {
		buffer = arguments[i]
		length += buffer.byteLength
	}

	var joined = new Uint8Array(length)
	var offset = 0

	for (var i in arguments) {
		buffer = arguments[i]
		joined.set(new Uint8Array(buffer), offset)
		offset += buffer.byteLength
	}

	return joined.buffer
}
function ab2b64(buffer) {
	var binary = '';
	var bytes = new Uint8Array(buffer);
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
}
function buf(base64) {
	
	var binary_string = window.atob(base64);
	var len = binary_string.length;
	var bytes = new Uint8Array(len);
	for (var i = 0; i < len; i++) {
		bytes[i] = binary_string.charCodeAt(i);
	}
	return bytes.buffer;
}
function ab2str(buf) {
	return String.fromCharCode.apply(null, new Uint16Array(buf));
}
function str2ab(str) {
	var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
	var bufView = new Uint16Array(buf);
	for (var i = 0, strLen = str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return buf;
}
function b64(buf) {
	if (buf.buffer && (buf.buffer instanceof ArrayBuffer))
		return ab2b64(buf.buffer)
	else 
		return ab2b64(buf)
}

function split(arr,p){
	return [arr.slice(0,p),arr.slice(p)]
}
