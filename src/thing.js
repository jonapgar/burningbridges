function bind(func, b,k) {
	let name = b.__name__
	return (...args) => {
		let thing = b[name]
		b[name] = new Promise(async (resolve,reject) => {
			try {
				
				thing = await thing
				console.log(k,thing)
				thing = func(thing, ...args)
			} catch (e) {
				return reject(e)
			}
			resolve(thing)
		})
		return b
	}
}

export default a=>((thing,__name__='promise')=>{
	a = {
		log(thing, func) {
			console.log(func ? func(thing):thing)
			return thing
		},
		tap(thing, func) {
			func(thing)
			return thing
		},
		then(thing, func) {
			return func(thing)
		},
		...a
	}
	let b = {[__name__]:Promise.resolve(thing),__name__ }
	for (let k in a) {
		b[k] = bind(a[k], b,k)
	}
	b.catch = f=>b[__name__].catch(err=>{
		b[__name__] = new Promise(async (resolve,reject)=>{
			let ret
			try {
				ret = await f(err)
			} catch (e) {
				return reject(e)
			}
			resolve(ret)
		}) 
		return b
	})
	return b
})


