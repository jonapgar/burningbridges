import * as _ from '../node_modules/ipfs/dist/index.js'
const Ipfs = window.Ipfs
const Buffer = Ipfs.Buffer
import * as conf from './conf.js'
let node
function getNode(){
    if (node)
        return node.ready
    let options = conf.IPFS && conf.IPFS.core || {
        libp2p:{
            config:{
                dht:{
                    enabled:true
                }
            }
        },
        repo: 'ipfs-' + Math.random(),
        config: {
            Addresses: {
                Swarm: ['/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star']
            }
        }
    }
    let exp = options.EXPERIMENTAL = options.EXPERIMENTAL || {}
    exp.pubsub=true
    exp.dht=true
    node = new Ipfs(options)
    return node.ready = new Promise(res=>{
        let handle = ()=>{
            node.off('ready',handle)
            res(node)
        }
        node.on('ready',handle)
    })
}

export  {getNode,Buffer,Ipfs}