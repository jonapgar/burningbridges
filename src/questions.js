import ask from './ask.js'
function w(...q){
    return ()=>ask(...q)
}
const askPassword = w('Enter Your Password')
const bridgeOfDeath = w('What is your name?','What is your favourite color?','What is the air-speed velocity of unladen swallow?')
export {
    askPassword,
    bridgeOfDeath
}

