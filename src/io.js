// io.js
const handlers = {}
const events = {}
export { out, trigger, on }

function out(data) {
  console.log(data)
}
function trigger(event, ...args) {
  if (handlers[event]) events[event](...args)
}
function on(event, handler) {
  (handlers[event] = handlers[event] || []).push(handler)
  events[event] = (...args) => {
    handlers[event].forEach(handler => handler(...args))
  }
}
