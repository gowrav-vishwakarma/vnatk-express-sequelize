var request = require('supertest');
var assert = require('assert');

const { sequelize } = require('./models');
const importFullCorrectData = require('./data/importFullCorrectData.js');


before(async () => {
    // await sequelize.sync({ force: true });
});

describe('Auto Import Testing', function () {
    var server;
    server = require('../testapp', { bustCache: true });

    it('import in complete', function testSlash(done) {
        var importdata = importFullCorrectData.data.map((i) =>
            importFullCorrectData.rowformatter(i)
        );
        request(server)
            .post('/vnatk/executeaction')
            .send({
                action_to_execute: { name: 'vnatk_autoimport' },
                importdata: importdata,
                model: 'User',
                transaction: 'file'
            })
            .expect(200, done)
    });

    server.close()
});