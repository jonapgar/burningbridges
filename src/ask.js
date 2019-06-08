import { write,answer,secret } from './console.js';
export default ask
let asking
async function ask(...questions){
	if (questions.length>1) {
        let answers =[]
        for (let question of questions) {
            answers.push(await ask(question))
        }
        return answers
    }   
    let [question] = questions
    await asking
    write(question)
    secret()
	return asking = new Promise(answer)
}

