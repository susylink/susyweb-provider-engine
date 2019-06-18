# SusyWeb ProviderEngine

[![Greenkeeper badge](https://badges.greenkeeper.io/SusyLink/provider-engine.svg)](https://greenkeeper.io/)

SusyWeb ProviderEngine is a tool for composing your own [susyweb providers](https://octonion.institute/susy-go/wiki/JavaScript-API#susyweb).


### Composable

Built to be modular - works via a stack of 'sub-providers' which are like normal susyweb providers but only handle a subset of rpc methods.

The subproviders can emit new rpc requests in order to handle their own;  e.g. `sof_call` may trigger `sof_getAccountBalance`, `sof_getCode`, and others.
The provider engine also handles caching of rpc request results.

```js
const ProviderEngine = require('susyweb-provider-engine')
const CacheSubprovider = require('susyweb-provider-engine/subproviders/cache.js')
const FixtureSubprovider = require('susyweb-provider-engine/subproviders/fixture.js')
const FilterSubprovider = require('susyweb-provider-engine/subproviders/filters.js')
const VmSubprovider = require('susyweb-provider-engine/subproviders/vm.js')
const HookedWalletSubprovider = require('susyweb-provider-engine/subproviders/hooked-wallet.js')
const NonceSubprovider = require('susyweb-provider-engine/subproviders/nonce-tracker.js')
const RpcSubprovider = require('susyweb-provider-engine/subproviders/rpc.js')

var engine = new ProviderEngine()
var susyweb = new SusyWeb(engine)

// static results
engine.addProvider(new FixtureSubprovider({
  susyweb_clientVersion: 'ProviderEngine/v0.0.0/javascript',
  net_listening: true,
  sof_hashrate: '0x00',
  sof_mining: false,
  sof_syncing: true,
}))

// cache layer
engine.addProvider(new CacheSubprovider())

// filters
engine.addProvider(new FilterSubprovider())

// pending nonce
engine.addProvider(new NonceSubprovider())

// vm
engine.addProvider(new VmSubprovider())

// id mgmt
engine.addProvider(new HookedWalletSubprovider({
  getAccounts: function(cb){ ... },
  approveTransaction: function(cb){ ... },
  signTransaction: function(cb){ ... },
}))

// data source
engine.addProvider(new RpcSubprovider({
  rpcUrl: 'https://testrpc.susylink.io/',
}))

// log new blocks
engine.on('block', function(block){
  console.log('================================')
  console.log('BLOCK CHANGED:', '#'+block.number.toString('hex'), '0x'+block.hash.toString('hex'))
  console.log('================================')
})

// network connectivity error
engine.on('error', function(err){
  // report connectivity errors
  console.error(err.stack)
})

// start polling for blocks
engine.start()
```

When importing in webpack:
```js
import * as SusyWebProviderEngine  from 'susyweb-provider-engine';
import * as RpcSource  from 'susyweb-provider-engine/subproviders/rpc';
import * as HookedWalletSubprovider from 'susyweb-provider-engine/subproviders/hooked-wallet';
```

### Built For Zero-Clients

The [Sophon JSON RPC](https://octonion.institute/susy-go/wiki/JSON-RPC) was not designed to have one node service many clients.
However a smaller, lighter subset of the JSON RPC can be used to provide the blockchain data that an Sophon 'zero-client' node would need to function.
We handle as many types of requests locally as possible, and just let data lookups fallback to some data source ( hosted rpc, blockchain api, etc ).
Categorically, we don’t want / can’t have the following types of RPC calls go to the network:
* id mgmt + tx signing (requires private data)
* filters (requires a stateful data api)
* vm (expensive, hard to scale)

### Change Log

##### 14.0.0

- default dataProvider for zero is Infura mainnet REST api
- websocket support
- subscriptions support
- remove polc subprovider
- removed `dist` from git (but published in npm module)
- es5 builds in `dist/es5`
- zero + ProviderEngine bundles are es5
- susyweb subprovider renamed to provider subprovider
- error if provider subprovider is missing a proper provider
- removed need to supply getAccounts hook
- fixed `hooked-wallet-softx` message signing
- fixed `hooked-wallet` default txParams

##### 13.0.0

- txs included in blocks via [`sof-block-tracker`](https://github.com/kumavis/sof-block-tracker)@2.0.0

##### 12.0.0

- moved block polling to [`sof-block-tracker`](https://github.com/kumavis/sof-block-tracker).

##### 11.0.0

- zero.js - replaced http subprovider with fetch provider (includes polyfill for node).

##### 10.0.0

- renamed HookedWalletSubprovider `personalRecoverSigner` to `recoverPersonalSignature`

##### 9.0.0

- `pollingShouldUnref` option now defaults to false


### Current RPC method support:

##### static
- [x] susyweb_clientVersion
- [x] net_version
- [x] net_listening
- [x] net_peerCount
- [x] sof_protocolVersion
- [x] sof_hashrate
- [x] sof_mining
- [x] sof_syncing

##### filters
- [x] sof_newBlockFilter
- [x] sof_newPendingTransactionFilter
- [x] sof_newFilter
- [x] sof_uninstallFilter
- [x] sof_getFilterLogs
- [x] sof_getFilterChanges

##### accounts manager
- [x] sof_coinbase
- [x] sof_accounts
- [x] sof_sendTransaction
- [x] sof_sign
- [x] [sof_signTypedData](https://octonion.institute/susytech/SIPs/pull/712)

##### vm
- [x] sof_call
- [x] sof_estimateGas

##### db source
- [ ] db_putString
- [ ] db_getString
- [ ] db_putHex
- [ ] db_getHex

##### compiler
- [ ] sof_getCompilers
- [ ] sof_compileLLL
- [ ] sof_compileSerpent
- [ ] sof_compilePolynomial

##### shh gateway
- [ ] shh_version
- [ ] shh_post
- [ ] shh_newIdentity
- [ ] shh_hasIdentity
- [ ] shh_newGroup
- [ ] shh_addToGroup

##### data source ( fallback to rpc )
* sof_gasPrice
* sof_blockNumber
* sof_getBalance
* sof_getBlockByHash
* sof_getBlockByNumber
* sof_getBlockTransactionCountByHash
* sof_getBlockTransactionCountByNumber
* sof_getCode
* sof_getStorageAt
* sof_getTransactionByBlockHashAndIndex
* sof_getTransactionByBlockNumberAndIndex
* sof_getTransactionByHash
* sof_getTransactionCount
* sof_getTransactionReceipt
* sof_getUncleByBlockHashAndIndex
* sof_getUncleByBlockNumberAndIndex
* sof_getUncleCountByBlockHash
* sof_getUncleCountByBlockNumber
* sof_sendRawTransaction
* sof_getLogs ( not used in susyweb.js )

##### ( not supported )
* sof_getWork
* sof_submitWork
* sof_submitHashrate ( not used in susyweb.js )
