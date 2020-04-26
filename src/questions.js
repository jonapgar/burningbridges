import ask from './ask.js'

const askPassword = () => ask({ question: 'Enter Your Password', secret: true })
const bridgeOfDeath = () => ask('What is your name?', 'What is your favourite color?', 'What is the air-speed velocity of unladen swallow?')
export {
  askPassword,
  bridgeOfDeath,
}
