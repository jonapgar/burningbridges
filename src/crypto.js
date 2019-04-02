//crypto.js
module.exports = {
    getPassphraseKey,
    generateSignVerify,
    generateEncryptDecrypt,
    encrypt,
    decrypt,
    random,
    sign,
    verify,
    importMyPrivateSigningKey,
    importMyPrivateDecryptionKey,
    importTheirPublicVerificationKey,
    importTheirPublicEncryptionKey
}

const IVLENGTH = 16
const { subtle } = window.crypto

function random(length = IVLENGTH) {
    return window.crypto.getRandomValues(new Uint8Array(length))
}

async function getPassphraseKey(passphrase, salt) {

    let key = await subtle.importKey('raw', passphrase, { name: 'PBKDF2' }, false, ['deriveKey'])
    return subtle.deriveKey({
            "name": "PBKDF2",
            salt,
            iterations: 1000,
            hash: { name: "SHA-1" }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
        },
        key, //your key from generateKey or importKey
        { //the key type you want to create based on the derived bits
            name: "AES-CBC", //can be any AES algorithm ("AES-CTR", "AES-CBC", "AES-CMAC", "AES-GCM", "AES-CFB", "AES-KW", "ECDH", "DH", or "HMAC")
            //the generateKey parameters for that type of algorithm
            length: 256, //can be  128, 192, or 256
        },
        false, //whether the derived key is extractable (i.e. can be used in exportKey)
        ["encrypt","decrypt","wrapKey", "unwrapKey"] //limited to the options in that algorithm's importKey
    )

}

async function generateSignVerify(passphraseKey) {
    let key = await subtle.generateKey({
            name: "ECDSA",
            namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
        },
        true, //whether the key is extractable (i.e. can be used in exportKey)
        ["sign", "verify"] //can be any combination of "sign" and "verify"
    )
    let iv = random()
    return {
        sign: await subtle.wrapKey('pkcs8', key.privateKey, passphraseKey, { //these are the wrapping key's algorithm options
            name: "AES-CBC",
            iv,
        }),
        verify: await subtle.exportKey('spki', key.publicKey),
        sign_iv: iv
    }
}
async function generateEncryptDecrypt(passphraseKey) {
    let key = await subtle.generateKey({
            name: "RSA-OAEP",
            modulusLength: 2048, //can be 1024, 2048, or 4096
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: { name: "SHA-256" }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
        },
        true, //whether the key is extractable (i.e. can be used in exportKey)
        ["encrypt", "decrypt"] //must be ["encrypt", "decrypt"] or ["wrapKey", "unwrapKey"]
    )
    let iv = random()
    return {
        decrypt: await subtle.wrapKey('pkcs8', key.privateKey, passphraseKey, { //these are the wrapping key's algorithm options
            name: "AES-CBC",
            iv,
        }),
        encrypt: await subtle.exportKey('spki', key.publicKey),
        decrypt_iv: iv
    }
}



async function sign(buffer, myPrivateSigningKey) {
    return await subtle.sign({
        name: "ECDSA",
        hash: { name: "SHA-256" }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
    }, myPrivateSigningKey, buffer)

}
async function verify(buffer, signature, theirPublicVerificationKey) {
    return subtle.verify({
        name: "ECDSA",
        hash: { name: "SHA-256" }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
    }, theirPublicVerificationKey, signature, buffer)
}


async function encrypt(buffer, theirPublicEncryptionKey) {
    let key = await subtle.generateKey({
            name: "AES-CBC",
            length: 256, //can be  128, 192, or 256
        },
        true, //whether the key is extractable (i.e. can be used in exportKey)
        ["encrypt", "decrypt"] //can be "encrypt", "decrypt", "wrapKey", or "unwrapKey"
    )

    let iv = random(IVLENGTH)
    let encryptedKey = await subtle.encrypt('RSA-OAEP', theirPublicEncryptionKey, await suble.exportKey('raw', key))
    let b = new Buffer(1)
    b.writeUint8(encryptedKey.length,0)
    return Buffer.concat(
    	b,
        encryptedKey,
        iv,
        await subtle.encrypt({
                name: "AES-CBC",
                iv
            },
            key,
            buffer
        ))
}

async function decrypt(buffer, myPrivateDecryptionKey) {
	let keyLen = buffer[0]
    let keyPart = buffer.slice(1, keyLen)

    let key = await subtle.importKey(
        'raw',
        await subtle.decrypt('RSA-OAEP', myPrivateDecryptionKey, keyPart), {
            name: "AES-CBC",
        },
        false,
        ["encrypt", "decrypt"]
    )
    let iv = buffer.slice(1 + keyLen, IVLENGTH)

    return subtle.decrypt({
            name: "AES-CBC",
            iv,
        },
        key,
        buffer.slice(1 + KEYLEN + IVLENGTH)
    )

}


function importTheirPublicEncryptionKey(theirPublicKeyBuffer) {
    return subtle.importKey(
        'spki',
        theirPublicKeyBuffer, { //these are the algorithm options
            name: "RSA-OAEP",
            hash: { name: "SHA-256" }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
        },
        false,
        ["encrypt"]
    )
}

function importMyPrivateDecryptionKey(myPrivateKeyBuffer, passphraseKey, iv) {
    return subtle.unwrapKey(
        'pkcs8',
        myPrivateKeyBuffer,
        passphraseKey, { //these are the wrapping key's algorithm options
            name: "AES-CBC",
            iv, //The initialization vector you used to encrypt
        }, { //these are the algorithm options
            name: "RSA-OAEP",
            hash: { name: "SHA-256" }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
        },
        false,
        ["decrypt"]
    )
}

function importTheirPublicVerificationKey(theirPublicKeyBuffer) {
    return subtle.importKey(
        'spki',
        theirPublicKeyBuffer, { //these are the algorithm options
            name: "ECDSA",
            namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
        },
        false,
        ["verify"]
    )
}

function importMyPrivateSigningKey(myPrivateKeyBuffer, passphraseKey, iv) {
    return subtle.unwrapKey(
        'pkcs8',
        myPrivateKeyBuffer,
        passphraseKey, { //these are the wrapping key's algorithm options
            name: "AES-CBC",
            iv, //The initialization vector you used to encrypt
        }, {
            //these are the algorithm options
            name: "ECDSA",
            namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
        },
        false,
        ["sign"]
    )
}