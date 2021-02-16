var request = require('supertest');
var assert = require('assert');

const { sequelize } = require('./models');


before(async () => {
    await sequelize.sync({ force: true });
});

describe('Minimum setup testing', function () {
    var server;
    server = require('../testapp', { bustCache: true });

    it('responds to /', function testSlash(done) {
        request(server)
            .get('/')
            .expect(200, done);
    });

    it('responds to /vnatk/crud with correct model', function testSlash(done) {
        request(server)
            .post('/vnatk/crud')
            .send({ model: 'User' })
            .expect((res) => {
                assert.deepStrictEqual(res.body, { data: [] });
            })
            .expect(200, done);
    });
    it('responds to /vnatk/crud with wrong model', function testSlash(done) {
        request(server)
            .post('/vnatk/crud')
            .send({ model: '_User' })
            .expect(res => {
                assert(res.body.error, true)
                assert.strictEqual(res.body.Message, 'Model _User not found')
            })
            .expect(500, done);
    });

    it('404 everything else', function testPath(done) {
        request(server)
            .get('/foo/bar')
            .expect(404, done);
    });


    server.close()
});