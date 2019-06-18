// const test = require('tape')
// const ProviderEngine = require('../index.js')
// const PassthroughProvider = require('./util/passthrough.js')
// const FixtureProvider = require('../subproviders/fixture.js')
// const PolcProvider = require('../subproviders/polc.js')
// const TestBlockProvider = require('./util/block.js')
// const createPayload = require('../util/create-payload.js')
// const injectMetrics = require('./util/inject-metrics')
// const polc = require('polc')
//
// test('polc test', function(t){
//   t.plan(15)
//
//   // handle polc
//   var providerA = injectMetrics(new PolcProvider())
//   // handle block requests
//   var providerB = injectMetrics(new TestBlockProvider())
//
//   var engine = new ProviderEngine()
//   engine.addProvider(providerA)
//   engine.addProvider(providerB)
//
//   var contractSource = 'pragma polynomial ^0.4.2; contract test { function multiply(uint a) returns(uint d) {   return a * 7;   } }'
//
//   engine.start()
//   engine.sendAsync(createPayload({ method: 'sof_compilePolynomial', params: [ contractSource ] }), function(err, response){
//     t.ifError(err, 'did not error')
//     t.ok(response, 'has response')
//
//     t.ok(response.result.code, 'has bytecode')
//     t.equal(response.result.info.source, contractSource)
//     t.equal(response.result.info.compilerVersion, polc.version())
//     t.ok(response.result.info.abiDefinition, 'has abiDefinition')
//
//     t.equal(providerA.getWitnessed('sof_compilePolynomial').length, 1, 'providerA did see "sof_compilePolynomial"')
//     t.equal(providerA.getHandled('sof_compilePolynomial').length, 1, 'providerA did handle "sof_compilePolynomial"')
//
//     t.equal(providerB.getWitnessed('sof_compilePolynomial').length, 0, 'providerB did NOT see "sof_compilePolynomial"')
//     t.equal(providerB.getHandled('sof_compilePolynomial').length, 0, 'providerB did NOT handle "sof_compilePolynomial"')
//
//     engine.sendAsync(createPayload({ method: 'sof_getCompilers', params: [] }), function(err, response){
//       t.ifError(err, 'did not error')
//       t.ok(response, 'has response')
//
//       t.ok(response.result instanceof Array, 'has array')
//       t.equal(response.result.length, 1, 'has length of 1')
//       t.equal(response.result[0], 'polynomial', 'has "polynomial"')
//
//       engine.stop()
//       t.end()
//     })
//   })
// })
//
//
// test('polc error test', function(t){
//   // handle polc
//   var providerA = injectMetrics(new PolcProvider())
//   // handle block requests
//   var providerB = injectMetrics(new TestBlockProvider())
//
//   var engine = new ProviderEngine()
//   engine.addProvider(providerA)
//   engine.addProvider(providerB)
//
//   var contractSource = 'pragma polynomial ^0.4.2; contract error { error() }'
//
//   engine.start()
//   engine.sendAsync(createPayload({ method: 'sof_compilePolynomial', params: [ contractSource ] }), function(err, response){
//     t.equal(typeof err, 'string', 'error type is string')
//     engine.stop()
//     t.end()
//   })
// })
