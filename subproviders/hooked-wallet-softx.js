/*
 * Uses sophonjs-tx to sign a transaction.
 *
 * The two callbacks a user needs to implement are:
 * - getAccounts() -- array of addresses supported
 * - getPrivateKey(address) -- return private key for a given address
 *
 * Optionally approveTransaction(), approveMessage() can be supplied too.
 */

const inherits = require('util').inherits
const HookedWalletProvider = require('./hooked-wallet.js')
const SofTx = require('sophonjs-tx')
const sofUtil = require('sophonjs-util')
const sigUtil = require('sof-sig-util')

module.exports = HookedWalletSofTxSubprovider

inherits(HookedWalletSofTxSubprovider, HookedWalletProvider)

function HookedWalletSofTxSubprovider(opts) {
  const self = this

  HookedWalletSofTxSubprovider.super_.call(self, opts)

  self.signTransaction = function(txData, cb) {
    // defaults
    if (txData.gas !== undefined) txData.gasLimit = txData.gas
    txData.value = txData.value || '0x00'
    txData.data = sofUtil.addHexPrefix(txData.data)

    opts.getPrivateKey(txData.from, function(err, privateKey) {
      if (err) return cb(err)

      var tx = new SofTx(txData)
      tx.sign(privateKey)
      cb(null, '0x' + tx.serialize().toString('hex'))
    })
  }

  self.signMessage = function(msgParams, cb) {
    opts.getPrivateKey(msgParams.from, function(err, privateKey) {
      if (err) return cb(err)
      var dataBuff = sofUtil.toBuffer(msgParams.data)
      var msgHash = sofUtil.hashPersonalMessage(dataBuff)
      var sig = sofUtil.ecsign(msgHash, privateKey)
      var serialized = sofUtil.bufferToHex(concatSig(sig.v, sig.r, sig.s))
      cb(null, serialized)
    })
  }

  self.signPersonalMessage = function(msgParams, cb) {
    opts.getPrivateKey(msgParams.from, function(err, privateKey) {
      if (err) return cb(err)
      const serialized = sigUtil.personalSign(privateKey, msgParams)
      cb(null, serialized)
    })
  }

  self.signTypedMessage = function (msgParams, cb) {
    opts.getPrivateKey(msgParams.from, function(err, privateKey) {
      if (err) return cb(err)
      const serialized = sigUtil.signTypedData(privateKey, msgParams)
      cb(null, serialized)
    })
  }

}

function concatSig(v, r, s) {
  r = sofUtil.fromSigned(r)
  s = sofUtil.fromSigned(s)
  v = sofUtil.bufferToInt(v)
  r = sofUtil.toUnsigned(r).toString('hex').padStart(64, 0)
  s = sofUtil.toUnsigned(s).toString('hex').padStart(64, 0)
  v = sofUtil.stripHexPrefix(sofUtil.intToHex(v))
  return sofUtil.addHexPrefix(r.concat(s, v).toString("hex"))
}
