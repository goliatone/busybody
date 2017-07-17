'use strict';

var _ = require('lodash');
var budybody = require('..');
var Node = budybody.Node;
var Bridge = budybody.Bridge;

var assert = require('assert');

var async = require('async');

describe('Bridge', function () {
  describe('construction', function () {
    var testBridge;

    it('should construct normally', function (done) {
      testBridge = budybody.createBridge(function () {
        assert(testBridge instanceof Bridge);
        assert.equal(testBridge._config.port, 8221);
        testBridge._server.close(done);
    });
      testBridge._server.unref();
  });

    it('should allow setting of the listening port', function (done) {
      testBridge = budybody.createBridge({
        port: 9003
      }, function (err) {
        assert.ifError(err)
        assert.equal(testBridge._config.port, 9003)
        testBridge._server.close(done)
      })
      testBridge._server.unref()
    })

    it('should pass any errors to a listener callback', function (done) {
      testBridge = budybody.createBridge(function () {
        var dupeBridge = budybody.createBridge(function (err) {
          assert(err)
          testBridge._server.close(done)
        })
        dupeBridge._server.unref()
      })
      testBridge._server.unref()
    })
  })

  describe('close', function () {
    var b, goodNodes

    goodNodes = []

    before(function (done) {
      done = _.after(2, done)
      b = budybody.createBridge()
      b._server.unref()
      goodNodes.push(budybody.createNode({
        id: 'node_1',
        onConnect: function (err) {
          assert.ifError(err)
          done()
        }
      }))
      goodNodes.push(budybody.createNode({
        id: 'node_2',
        onConnect: function (err) {
          assert.ifError(err)
          done()
        }
      }))
    })

    after(function () {
      b._server && b._server._handle && b._server.close()
    })

    it('should send a close message to all connected nodes', function (done) {
      async.parallel([
        function (cb) {
          goodNodes[0].on('close', function (partingData) {
            assert.equal(partingData, 'live long and prosper')
            cb()
          })
        },
        function (cb) {
          goodNodes[1].on('close', function (partingData) {
            assert.equal(partingData, 'live long and prosper')
            cb()
          })
        }
      ], done)

      b.close(['live long and prosper'])
    })
  })
})

describe('Node', function () {
  describe('construction', function () {
    var b, b2

    before(function () {
      b2 = budybody.createBridge({
        port: 9823
      })
      b = budybody.createBridge()
      b._server.unref()
      b2._server.unref()
    })

    after(function () {
      b._server && b._server._handle && b._server.close()
      b2._server && b2._server._handle && b2._server.close()
    })

    it('should be backwards compatible with v1.x', function (done) {
      done = _.after(2, done)
      var node = new Node('node_22', function (err) {
        assert.ifError(err)
        done()
      })
      assert(node instanceof Node)

      var node2 = budybody.createNode('node_34', function (err) {
        assert.ifError(err)
        done()
      })
      assert(node2 instanceof Node)
    })

    it('should construct normally and callback when connected to the bridge', function (done) {
      budybody.createNode({
        id: 'node_1',
        onConnect: function (err) {
          assert.ifError(err)
          done()
        }
      })
    })

    it('should fail because the name is taken', function (done) {
      budybody.createNode({
        id: 'node_1',
        onConnect: function (err) {
          assert(err)
          done()
        }
      })
    })

    it('should fail because there is no bridge listening on specified port', function (done) {
      this.timeout(3000)

      budybody.createNode({
        id: 'muh_dumb_node',
        port: 9999,
        onConnect: function (err) {
          assert(err);
          done();
        }
      })
    })

    it('should be able to connect normally to a server on a different port', function (done) {
      budybody.createNode({
        id: 'node_3',
        port: 9823,
        onConnect: function (err) {
          assert.ifError(err)
          done()
        }
      })
    })
  })

  describe('tell', function () {
    var b, goodNodes

    goodNodes = []

    before(function (done) {
      done = _.after(2, done)
      b = new Bridge()
      b._server.unref()
      goodNodes.push(budybody.createNode({
        id: 'node_1',
        onConnect: function (err) {
          assert.ifError(err)
          done()
        }
      }))
      goodNodes.push(budybody.createNode({
        id: 'node_2',
        onConnect: function (err) {
          assert.ifError(err)
          done()
        }
      }))
    })

    after(function () {
      b._server && b._server._handle && b._server.close()
    })

    afterEach(function () {
      goodNodes.forEach(function (n) {
        n.removeAllListeners()
      })
    })

    it('should be able to contact another node', function (done) {
      goodNodes[0].on('test_event', function (param1) {
        assert.equal(param1, 'test_param')
        done()
      })
      goodNodes[1].tell('node_1:test_event', 'test_param')
    })

    it('should be able to contact another node and send callbacks', function (done) {
      goodNodes[0].on('test_event', function (param1, ack) {
        assert.equal(param1, 'test_param')
        ack('my-reply')
      })
      goodNodes[1].tell('node_1:test_event', 'test_param', function (a) {
        assert.equal(a, 'my-reply')
        done()
      })
    })

    it("should fail if the who and what format is not valid ('node_name:remote_event')", function () {
      assert.throws(function () {
        goodNodes[1].tell('node_1-what-the-hell')
      })
      assert.throws(function () {
        goodNodes[1].tell('node_1:too:many:colons')
      })
    })

    it('should fail if the node being told does not exist', function (done) {
      goodNodes[0].tell('me-no-exist:remote_event', function (err) {
        assert.equal(err, 'unknown-node')
        done()
      })
    })
  })

  describe('shout', function () {
    var b, goodNodes

    goodNodes = []

    before(function (done) {
      b = budybody.createBridge()
      async.parallel([
        function (cb) {
          goodNodes.push(budybody.createNode({id: 'node_1', onConnect: cb}))
        },
        function (cb) {
          goodNodes.push(budybody.createNode({id: 'node_2', onConnect: cb}))
        },
        function (cb) {
          goodNodes.push(budybody.createNode({id: 'node_3', onConnect: cb}))
        }
      ], function (err) {
        assert.ifError(err)
        done()
      })
    })

    after(function () {
      b._server && b._server._handle && b._server.close()
    })

    afterEach(function () {
      goodNodes.forEach(function (n) {
        n.removeAllListeners()
      })
    })

    it('should send events to all connected nodes', function (done) {
      async.parallel([
        function (done) {
          goodNodes[0].on('shout_eve', function (param1) {
            assert.equal(param1, 'test-param')
            done()
          })
        },
        function (done) {
          goodNodes[1].on('shout_eve', function (param1) {
            assert.equal(param1, 'test-param')
            done()
          })
        }
      ], done)

      goodNodes[2].shout('shout_eve', 'test-param')
    })

    it('should catch events shouted very quickly', function (done) {
      async.parallel([
        function (done) {
          goodNodes[0].on('shout_eve', function (param1) {
            var isParamOk = param1 === 'test-param 1' ||
              param1 === 'test-param 2' ||
              param1 === 'test-param 3'

            assert.ok(isParamOk)
            done()
          })
        }
      ], done)

      goodNodes[2].shout('shout_eve', 'test-param 1')
      goodNodes[2].shout('shout_eve', 'test-param 2')
      goodNodes[2].shout('shout_eve', 'test-param 3')
    })
  })

  describe('leave', function () {
    var b

    before(function () {
      b = budybody.createBridge()
      b._server.unref()
    })

    after(function () {
      b._server && b._server._handle && b._server.close()
    })

    it('should tell the bridge that it is leaving', function (done) {
      var x = budybody.createNode({
        id: 'leaving_node',
        onConnect: function (err) {
          assert.ifError(err)
          x.leave()
          setTimeout(function () {
            assert.ok(!b._sockets.hasOwnProperty('leaving_node'), b._sockets)
            done()
          }, 20)
        }
      })
    })
  })
})
