import * as conf from './conf.js';
export {start,write,submit,answer,secret}

const {
    HISTORY_MAX=10
} = conf

window.onerror = write
window.onunhandledrejection = write
let input
let log
let trap
let execute
function start({input:i,log:l,execute:e}){
    execute = e
    input = i
    log = l
    input.onkeydown = onkeydown
}
function answer(resolve){
    trap=command=>{
        trap=null
        resolve(command)
    }
}
function secret(){
    input.type='password'
}
let recentIndex =0
const recent = []
const ENTER = 13
const ESCAPE = 27
const UP = 38
function onkeydown(e){
    switch (e.which) {
        case ENTER: {
            let command = input.value.trim()
            if (input.type!=='password') {
                write(command)
                if (recentIndex>HISTORY_MAX)
                    recent.shift()
                recentIndex = recent.push(command)
            }
            input.value = ''
                
            input.type='text'
            
            submit(command).catch(err=>{console.error(err);return err.stack}).then(response=>{
                if (response) 
                    write(response)
            })
            return
        }
        case UP:
            if (recentIndex!=0)
                input.value = recent[--recentIndex]
            return
        case ESCAPE:
            input.value = ''
            return 
        
    }
}
async function submit(command) {
    if (trap) {
        trap(command)
        return
    }

    command = command.trim()

    return execute(command).catch(err=>{
        throw err
    })	
}

function write(data){
	let node = document.createTextNode(data + '\n')
	log.appendChild(node)
}