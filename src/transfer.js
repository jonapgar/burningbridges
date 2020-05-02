import ipfs from './ipfs.js'

export { upload, download }

async function upload(buffer) {
  const node = await ipfs()
  return (await node.add(buffer)).path
}
async function download(path) {
  const node = await ipfs()
  const file = await node.get(path)
  if (!file) throw new Error(`No file at path "${path}"`)
  return file
}
