const inherits = require('util').inherits
const Subprovider = require('./subprovider.js')

module.exports = WhitelistProvider

inherits(WhitelistProvider, Subprovider)

function WhitelistProvider(methods){
  this.methods = methods;

  if (this.methods == null) {
    this.methods = [
      'sof_gasPrice',
      'sof_blockNumber',
      'sof_getBalance',
      'sof_getBlockByHash',
      'sof_getBlockByNumber',
      'sof_getBlockTransactionCountByHash',
      'sof_getBlockTransactionCountByNumber',
      'sof_getCode',
      'sof_getStorageAt',
      'sof_getTransactionByBlockHashAndIndex',
      'sof_getTransactionByBlockNumberAndIndex',
      'sof_getTransactionByHash',
      'sof_getTransactionCount',
      'sof_getTransactionReceipt',
      'sof_getUncleByBlockHashAndIndex',
      'sof_getUncleByBlockNumberAndIndex',
      'sof_getUncleCountByBlockHash',
      'sof_getUncleCountByBlockNumber',
      'sof_sendRawTransaction',
      'sof_getLogs'
    ];
  }
}

WhitelistProvider.prototype.handleRequest = function(payload, next, end){
  if (this.methods.indexOf(payload.method) >= 0) {
    next();
  } else {
    end(new Error("Method '" + payload.method + "' not allowed in whitelist."));
  }
}
