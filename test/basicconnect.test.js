var request = require('supertest');
var assert = require('assert');

const { sequelize } = require('./models');


before(async () => {
    await sequelize.sync();
});

describe('Minimum setup testing', function () {
    var server;
    server = require('../testapp', { bustCache: true });
    // beforeEach(function () {
    // server = require('../testapp', { bustCache: true });
    // });
    // afterEach(function (done) {
    //     server.close(done);
    // });
    it('responds to /', function testSlash(done) {
        request(server)
            .get('/')
            .expect(200, done);
    });
    it('responds to /vnatk/crud', function testSlash(done) {
        request(server)
            .post('/vnatk/crud')
            .send({ model: '_User' })
            .expect(500)
            .then(res => {
                assert(res.body.error, true)
                assert.equal(res.body.Message, 'Model _User not found')
                done();
            })
            .catch(err => done(err))
    });

    it('404 everything else', function testPath(done) {
        request(server)
            .get('/foo/bar')
            .expect(404, done);
    });


    server.close()
});