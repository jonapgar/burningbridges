//io.js
const handlers = {}
module.exports = {
	out(data){
		console.log(data)
	},
	trigger (event,...args){
		if (handlers[event])
			this[event](...args)
	},
	on(event,handler){
		(handlers[event] = handlers[event] || []).push(handler)
		this[event] = (...args)=>{
			handlers[event].forEach(handler=>handler(...args))
		}
	}
}

