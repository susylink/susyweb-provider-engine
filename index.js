const EventEmitter = require('events').EventEmitter
const inherits = require('util').inherits
const sofUtil = require('sophonjs-util')
const SofBlockTracker = require('sof-block-tracker')
const map = require('async/map')
const eachSeries = require('async/eachSeries')
const Stoplight = require('./util/stoplight.js')
const cacheUtils = require('./util/rpc-cache-utils.js')
const createPayload = require('./util/create-payload.js')
const noop = function(){}

module.exports = SusyWebProviderEngine


inherits(SusyWebProviderEngine, EventEmitter)

function SusyWebProviderEngine(opts) {
  const self = this
  EventEmitter.call(self)
  self.setMaxListeners(30)
  // parse options
  opts = opts || {}

  // block polling
  const directProvider = { sendAsync: self._handleAsync.bind(self) }
  const blockTrackerProvider = opts.blockTrackerProvider || directProvider
  self._blockTracker = opts.blockTracker || new SofBlockTracker({
    provider: blockTrackerProvider,
    pollingInterval: opts.pollingInterval || 4000,
  })

  // handle new block
  self._blockTracker.on('block', (jsonBlock) => {
    const bufferBlock = toBufferBlock(jsonBlock)
    self._setCurrentBlock(bufferBlock)
  })

  // emit block events from the block tracker
  self._blockTracker.on('block', self.emit.bind(self, 'rawBlock'))
  self._blockTracker.on('sync', self.emit.bind(self, 'sync'))
  self._blockTracker.on('latest', self.emit.bind(self, 'latest'))

  // set initialization blocker
  self._ready = new Stoplight()
  // unblock initialization after first block
  self._blockTracker.once('block', () => {
    self._ready.go()
  })
  // local state
  self.currentBlock = null
  self._providers = []
}

// public

SusyWebProviderEngine.prototype.start = function(cb = noop){
  const self = this
  // start block polling
  self._blockTracker.start().then(cb).catch(cb)
}

SusyWebProviderEngine.prototype.stop = function(){
  const self = this
  // stop block polling
  self._blockTracker.stop()
}

SusyWebProviderEngine.prototype.addProvider = function(source){
  const self = this
  self._providers.push(source)
  source.setEngine(this)
}

SusyWebProviderEngine.prototype.send = function(payload){
  throw new Error('SusyWebProviderEngine does not support synchronous requests.')
}

SusyWebProviderEngine.prototype.sendAsync = function(payload, cb){
  const self = this
  self._ready.await(function(){

    if (Array.isArray(payload)) {
      // handle batch
      map(payload, self._handleAsync.bind(self), cb)
    } else {
      // handle single
      self._handleAsync(payload, cb)
    }

  })
}

// private

SusyWebProviderEngine.prototype._handleAsync = function(payload, finished) {
  var self = this
  var currentProvider = -1
  var result = null
  var error = null

  var stack = []

  next()

  function next(after) {
    currentProvider += 1
    stack.unshift(after)

    // Bubbled down as far as we could go, and the request wasn't
    // handled. Return an error.
    if (currentProvider >= self._providers.length) {
      end(new Error('Request for method "' + payload.method + '" not handled by any subprovider. Please check your subprovider configuration to ensure this method is handled.'))
    } else {
      try {
        var provider = self._providers[currentProvider]
        provider.handleRequest(payload, next, end)
      } catch (e) {
        end(e)
      }
    }
  }

  function end(_error, _result) {
    error = _error
    result = _result

    eachSeries(stack, function(fn, callback) {

      if (fn) {
        fn(error, result, callback)
      } else {
        callback()
      }
    }, function() {
      // console.log('COMPLETED:', payload)
      // console.log('RESULT: ', result)

      var resultObj = {
        id: payload.id,
        jsonrpc: payload.jsonrpc,
        result: result
      }

      if (error != null) {
        resultObj.error = {
          message: error.stack || error.message || error,
          code: -32000
        }
        // respond with both error formats
        finished(error, resultObj)
      } else {
        finished(null, resultObj)
      }
    })
  }
}

//
// from remote-data
//

SusyWebProviderEngine.prototype._setCurrentBlock = function(block){
  const self = this
  self.currentBlock = block
  self.emit('block', block)
}

// util

function toBufferBlock (jsonBlock) {
  return {
    number:           sofUtil.toBuffer(jsonBlock.number),
    hash:             sofUtil.toBuffer(jsonBlock.hash),
    parentHash:       sofUtil.toBuffer(jsonBlock.parentHash),
    nonce:            sofUtil.toBuffer(jsonBlock.nonce),
    mixHash:          sofUtil.toBuffer(jsonBlock.mixHash),
    sha3Uncles:       sofUtil.toBuffer(jsonBlock.sha3Uncles),
    logsBloom:        sofUtil.toBuffer(jsonBlock.logsBloom),
    transactionsRoot: sofUtil.toBuffer(jsonBlock.transactionsRoot),
    stateRoot:        sofUtil.toBuffer(jsonBlock.stateRoot),
    receiptsRoot:     sofUtil.toBuffer(jsonBlock.receiptRoot || jsonBlock.receiptsRoot),
    miner:            sofUtil.toBuffer(jsonBlock.miner),
    difficulty:       sofUtil.toBuffer(jsonBlock.difficulty),
    totalDifficulty:  sofUtil.toBuffer(jsonBlock.totalDifficulty),
    size:             sofUtil.toBuffer(jsonBlock.size),
    extraData:        sofUtil.toBuffer(jsonBlock.extraData),
    gasLimit:         sofUtil.toBuffer(jsonBlock.gasLimit),
    gasUsed:          sofUtil.toBuffer(jsonBlock.gasUsed),
    timestamp:        sofUtil.toBuffer(jsonBlock.timestamp),
    transactions:     jsonBlock.transactions,
  }
}
