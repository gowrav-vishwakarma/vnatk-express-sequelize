var request = require('supertest');
var assert = require('assert');

const { sequelize } = require('./models');


before(async () => {
    await sequelize.sync({ force: true });
});

describe('Auto Import Testing', function () {
    var server;
    server = require('../testapp', { bustCache: true });

    it('import in complete', function testSlash(done) {
        request(server)
            .get('/')
            .expect(200, done);
    });
    server.close()
});