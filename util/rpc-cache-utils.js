const stringify = require('json-stable-stringify')

module.exports = {
  cacheIdentifierForPayload: cacheIdentifierForPayload,
  canCache: canCache,
  blockTagForPayload: blockTagForPayload,
  paramsWithoutBlockTag: paramsWithoutBlockTag,
  blockTagParamIndex: blockTagParamIndex,
  cacheTypeForPayload: cacheTypeForPayload,
}

function cacheIdentifierForPayload(payload, opts = {}){
  if (!canCache(payload)) return null
  const { includeBlockRef } = opts
  const params = includeBlockRef ? payload.params : paramsWithoutBlockTag(payload)
  return payload.method + ':' + stringify(params)
}

function canCache(payload){
  return cacheTypeForPayload(payload) !== 'never'
}

function blockTagForPayload(payload){
  var index = blockTagParamIndex(payload);

  // Block tag param not passed.
  if (index >= payload.params.length) {
    return null;
  }

  return payload.params[index];
}

function paramsWithoutBlockTag(payload){
  var index = blockTagParamIndex(payload);

  // Block tag param not passed.
  if (index >= payload.params.length) {
    return payload.params;
  }

  // sof_getBlockByNumber has the block tag first, then the optional includeTx? param
  if (payload.method === 'sof_getBlockByNumber') {
    return payload.params.slice(1);
  }

  return payload.params.slice(0,index);
}

function blockTagParamIndex(payload){
  switch(payload.method) {
    // blockTag is third param
    case 'sof_getStorageAt':
      return 2
    // blockTag is second param
    case 'sof_getBalance':
    case 'sof_getCode':
    case 'sof_getTransactionCount':
    case 'sof_call':
    case 'sof_estimateGas':
      return 1
    // blockTag is first param
    case 'sof_getBlockByNumber':
      return 0
    // there is no blockTag
    default:
      return undefined
  }
}

function cacheTypeForPayload(payload) {
  switch (payload.method) {
    // cache permanently
    case 'susyweb_clientVersion':
    case 'susyweb_sha3':
    case 'sof_protocolVersion':
    case 'sof_getBlockTransactionCountByHash':
    case 'sof_getUncleCountByBlockHash':
    case 'sof_getCode':
    case 'sof_getBlockByHash':
    case 'sof_getTransactionByHash':
    case 'sof_getTransactionByBlockHashAndIndex':
    case 'sof_getTransactionReceipt':
    case 'sof_getUncleByBlockHashAndIndex':
    case 'sof_getCompilers':
    case 'sof_compileLLL':
    case 'sof_compilePolynomial':
    case 'sof_compileSerpent':
    case 'shh_version':
      return 'perma'

    // cache until fork
    case 'sof_getBlockByNumber':
    case 'sof_getBlockTransactionCountByNumber':
    case 'sof_getUncleCountByBlockNumber':
    case 'sof_getTransactionByBlockNumberAndIndex':
    case 'sof_getUncleByBlockNumberAndIndex':
      return 'fork'

    // cache for block
    case 'sof_gasPrice':
    case 'sof_blockNumber':
    case 'sof_getBalance':
    case 'sof_getStorageAt':
    case 'sof_getTransactionCount':
    case 'sof_call':
    case 'sof_estimateGas':
    case 'sof_getFilterLogs':
    case 'sof_getLogs':
    case 'net_peerCount':
      return 'block'

    // never cache
    case 'net_version':
    case 'net_peerCount':
    case 'net_listening':
    case 'sof_syncing':
    case 'sof_sign':
    case 'sof_coinbase':
    case 'sof_mining':
    case 'sof_hashrate':
    case 'sof_accounts':
    case 'sof_sendTransaction':
    case 'sof_sendRawTransaction':
    case 'sof_newFilter':
    case 'sof_newBlockFilter':
    case 'sof_newPendingTransactionFilter':
    case 'sof_uninstallFilter':
    case 'sof_getFilterChanges':
    case 'sof_getWork':
    case 'sof_submitWork':
    case 'sof_submitHashrate':
    case 'db_putString':
    case 'db_getString':
    case 'db_putHex':
    case 'db_getHex':
    case 'shh_post':
    case 'shh_newIdentity':
    case 'shh_hasIdentity':
    case 'shh_newGroup':
    case 'shh_addToGroup':
    case 'shh_newFilter':
    case 'shh_uninstallFilter':
    case 'shh_getFilterChanges':
    case 'shh_getMessages':
      return 'never'
  }
}
