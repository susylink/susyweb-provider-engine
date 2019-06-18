/*
 * Sophyscan.io API connector
 * @author github.com/axic
 *
 * The sophyscan.io API supports:
 *
 * 1) Natively via proxy methods
 * - sof_blockNumber *
 * - sof_getBlockByNumber *
 * - sof_getBlockTransactionCountByNumber
 * - getTransactionByHash
 * - getTransactionByBlockNumberAndIndex
 * - sof_getTransactionCount *
 * - sof_sendRawTransaction *
 * - sof_call *
 * - sof_getTransactionReceipt *
 * - sof_getCode *
 * - sof_getStorageAt *
 *
 * 2) Via non-native methods
 * - sof_getBalance
 * - sof_listTransactions (non-standard)
 */

const xhr = process.browser ? require('xhr') : require('request')
const inherits = require('util').inherits
const Subprovider = require('./subprovider.js')

module.exports = SophyscanProvider

inherits(SophyscanProvider, Subprovider)

function SophyscanProvider(opts) {
  opts = opts || {}
  this.network = opts.network || 'api'
  this.proto = (opts.https || false) ? 'https' : 'http'
  this.requests = [];
  this.times = isNaN(opts.times) ? 4 : opts.times;
  this.interval = isNaN(opts.interval) ? 1000 : opts.interval;
  this.retryFailed = typeof opts.retryFailed === 'boolean' ? opts.retryFailed : true; // not built yet
  
  setInterval(this.handleRequests, this.interval, this);
}

SophyscanProvider.prototype.handleRequests = function(self){
	if(self.requests.length == 0) return;
	
	//console.log('Handling the next ' + self.times + ' of ' + self.requests.length + ' requests');
	
	for(var requestIndex = 0; requestIndex < self.times; requestIndex++) {
		var requestItem = self.requests.shift()
  		
		if(typeof requestItem !== 'undefined')
			handlePayload(requestItem.proto, requestItem.network, requestItem.payload, requestItem.next, requestItem.end)
	}
}

SophyscanProvider.prototype.handleRequest = function(payload, next, end){
  var requestObject = {proto: this.proto, network: this.network, payload: payload, next: next, end: end},
	  self = this;
  
  if(this.retryFailed)
	  requestObject.end = function(err, result){
		  if(err === '403 - Forbidden: Access is denied.')
			 self.requests.push(requestObject);
		  else
			 end(err, result);
		  };
	
  this.requests.push(requestObject);
}

function handlePayload(proto, network, payload, next, end){
  switch(payload.method) {
    case 'sof_blockNumber':
      sophyscanXHR(true, proto, network, 'proxy', 'sof_blockNumber', {}, end)
      return

    case 'sof_getBlockByNumber':
      sophyscanXHR(true, proto, network, 'proxy', 'sof_getBlockByNumber', {
        tag: payload.params[0],
        boolean: payload.params[1] }, end)
      return

    case 'sof_getBlockTransactionCountByNumber':
      sophyscanXHR(true, proto, network, 'proxy', 'sof_getBlockTransactionCountByNumber', {
        tag: payload.params[0]
      }, end)
      return

    case 'sof_getTransactionByHash':
      sophyscanXHR(true, proto, network, 'proxy', 'sof_getTransactionByHash', {
        txhash: payload.params[0]
      }, end)
      return

    case 'sof_getBalance':
      sophyscanXHR(true, proto, network, 'account', 'balance', {
        address: payload.params[0],
        tag: payload.params[1] }, end)
      return

    case 'sof_listTransactions':
      const props = [
        'address',
        'startblock',
        'endblock',
        'sort',
        'page',
        'offset'
      ]

      const params = {}
      for (let i = 0, l = Math.min(payload.params.length, props.length); i < l; i++) {
        params[props[i]] = payload.params[i]
      }

      sophyscanXHR(true, proto, network, 'account', 'txlist', params, end)
      return

    case 'sof_call':
      sophyscanXHR(true, proto, network, 'proxy', 'sof_call', payload.params[0], end)
      return

    case 'sof_sendRawTransaction':
      sophyscanXHR(false, proto, network, 'proxy', 'sof_sendRawTransaction', { hex: payload.params[0] }, end)
      return

    case 'sof_getTransactionReceipt':
      sophyscanXHR(true, proto, network, 'proxy', 'sof_getTransactionReceipt', { txhash: payload.params[0] }, end)
      return

    // note !! this does not support topic filtering yet, it will return all block logs
    case 'sof_getLogs':
      var payloadObject = payload.params[0],
          txProcessed = 0,
          logs = [];

      sophyscanXHR(true, proto, network, 'proxy', 'sof_getBlockByNumber', {
        tag: payloadObject.toBlock,
        boolean: payload.params[1] }, function(err, blockResult) {
          if(err) return end(err);

          for(var transaction in blockResult.transactions){
            sophyscanXHR(true, proto, network, 'proxy', 'sof_getTransactionReceipt', { txhash: transaction.hash }, function(err, receiptResult) {
              if(!err) logs.concat(receiptResult.logs);
              txProcessed += 1;
              if(txProcessed === blockResult.transactions.length) end(null, logs)
            })
          }
        })
      return

    case 'sof_getTransactionCount':
      sophyscanXHR(true, proto, network, 'proxy', 'sof_getTransactionCount', {
        address: payload.params[0],
        tag: payload.params[1]
      }, end)
      return

    case 'sof_getCode':
      sophyscanXHR(true, proto, network, 'proxy', 'sof_getCode', {
        address: payload.params[0],
        tag: payload.params[1]
      }, end)
      return

    case 'sof_getStorageAt':
      sophyscanXHR(true, proto, network, 'proxy', 'sof_getStorageAt', {
        address: payload.params[0],
        position: payload.params[1],
        tag: payload.params[2]
      }, end)
      return

    default:
      next();
      return
  }
}

function toQueryString(params) {
  return Object.keys(params).map(function(k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(params[k])
  }).join('&')
}

function sophyscanXHR(useGetMethod, proto, network, module, action, params, end) {
  var uri = proto + '://' + network + '.sophyscan.io/api?' + toQueryString({ module: module, action: action }) + '&' + toQueryString(params)
	
  xhr({
    uri: uri,
    method: useGetMethod ? 'GET' : 'POST',
    headers: {
      'Accept': 'application/json',
      // 'Content-Type': 'application/json',
    },
    rejectUnauthorized: false,
  }, function(err, res, body) {
    // console.log('[sophyscan] response: ', err)

    if (err) return end(err)
	
	  /*console.log('[sophyscan request]' 
				  + ' method: ' + useGetMethod
				  + ' proto: ' + proto
				  + ' network: ' + network
				  + ' module: ' + module
				  + ' action: ' + action
				  + ' params: ' + params
				  + ' return body: ' + body);*/
	
    if(body.indexOf('403 - Forbidden: Access is denied.') > -1)
    	return end('403 - Forbidden: Access is denied.')
	  
    var data
    try {
      data = JSON.parse(body)
    } catch (err) {
      console.error(err.stack)
      return end(err)
    }

    // console.log('[sophyscan] response decoded: ', data)

    // NOTE: or use id === -1? (id=1 is 'success')
    if ((module === 'proxy') && data.error) {
      // Maybe send back the code too?
      return end(data.error.message)
    }

    // NOTE: or data.status !== 1?
    if ((module === 'account') && (data.message !== 'OK')) {
      return end(data.message)
    }

    end(null, data.result)
  })
}
