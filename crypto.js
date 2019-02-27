//crypto.js
module.exports = {encrypt,decrypt,sign,verify}

const {subtle} = window.crypto


async function sign(buffer,myPrivateKeyBuffer) {
	return await subtle.sign('ECDSA',await importMyPrivateSigningKey(myPrivateKeyBuffer),buffer)
	
}
async function verify(buffer,signature,theirPublicKeyBuffer) {
	return subtle.verify('ECDSA',await importTheirPublicVerificationKey(theirPublicKeyBuffer),signature,message)
}


async function encrypt(buffer, theirPublicKeyBuffer) {
	return await subtle.encrypt('RSA-OAEP',await importTheirPublicEncryptionKey(theirPublicKeyBuffer),buffer)
}

async function decrypt(buffer,myPrivateKeyBuffer) {
	return await subtle.decrypt('RSA-OAEP',await importMyPrivateDecryptionKey(myPrivateKeyBuffer),buffer)
}


function importTheirPublicEncryptionKey(theirPublicKeyBuffer) {
	return subtle.importKey(
		'spki',
		publicKey,
		{   //these are the algorithm options
	        name: "RSA-OAEP",
	        hash: {name: "SHA-256"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
	    },
	    false,
	    ["encrypt"]
   )
}

function importMyPrivateDecryptionKey(myPrivateKeyBuffer) {
	return subtle.importKey(
		'pkcs8',
		myPrivateKeyBuffer,
		{   //these are the algorithm options
	        name: "RSA-OAEP",
	        hash: {name: "SHA-256"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
	    },
	    false,
	    ["decrypt"]
   )
}

function importTheirPublicVerificationKey(theirPublicKeyBuffer) {
	return subtle.importKey(
		'spki',
		publicKey,
		{   //these are the algorithm options
	        name: "ECDSA",
	        namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
	    },
	    false,
	    ["verify"]
   )
}

function importMyPrivateSigningKey(myPrivateKeyBuffer) {
	return subtle.importKey(
		'pkcs8',
		myPrivateKeyBuffer,
		{   //these are the algorithm options
	        name: "ECDSA",
	        namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
	    },
	    false,
	    ["sign"]
   )
}

