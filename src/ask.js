import { write, answer, secret } from './console.js'

export default ask
let asking
async function ask(...questions) {
  if (questions.length > 1) {
    const answers = []
    for (const question of questions) {
      answers.push(await ask(question))
    }
    return answers
  }
  let [question] = questions
  await asking
  if (typeof question === 'object') {
    if (question.secret) {
      secret()
    }
    question = question.question
  }
  write(question)
  // eslint-disable-next-line no-return-assign
  return asking = new Promise(answer)
}
