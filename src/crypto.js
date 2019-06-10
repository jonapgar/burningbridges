//crypto.js
import { str2ab, ab2str, concat, buf, b64 } from './utils.js'
export {
    getPassphraseKey,
    generateSignVerify,
    generateExchange,
    getSecretKey,
    encrypt,
    decrypt,
    random,
    sign,
    verify,
    importMyPrivateSigningKey,
    importTheirPublicVerificationKey,
    importTheirPublicExchangeKey,
    importMyPrivateExchangeKey,
    
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
        ["encrypt", "decrypt", "wrapKey", "unwrapKey"] //limited to the options in that algorithm's importKey
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
async function generateExchange() {
    let {publicKey,privateKey} = await subtle.generateKey(
        {
            name: "ECDH",
            namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
        },
        true,
        ["deriveKey"]
    )
    return {publicKey:await subtle.exportKey('spki', publicKey),privateKey}
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

async function getSecretKey({ publicKey, privateKey }) {
    return subtle.deriveKey(
        {
            name: "ECDH",
            public:publicKey
        },
        privateKey,
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    );
}
async function encrypt(buffer, secretKey) {


    let iv = random(IVLENGTH)
    return concat(iv, await subtle.encrypt(
        {
            name: "AES-GCM",
            iv
        },
        secretKey,
        buffer
    ));
}

async function decrypt(buffer, secretKey) {
    let i = 0

    let iv = buffer.slice(i, i += IVLENGTH)

    return subtle.decrypt(
        {
            name: "AES-GCM",
            iv
        },
        secretKey,
        buffer.slice(i)
    );

}


function importTheirPublicExchangeKey(theirPublicKeyBuffer) {
    return subtle.importKey(
        'spki',
        theirPublicKeyBuffer,  
        { 
            name: "ECDH",
            namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
        },
        false, 
        [] 
   
    )
}

function importMyPrivateExchangeKey(myPrivateKeyBuffer) {
    return subtle.importKey(
        'pkcs8',
        myPrivateKeyBuffer,  
        { 
            name: "ECDH",
            namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
        },
        false, 
        ["deriveKey"] 
   
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