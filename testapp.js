var express = require('express');
const bodyParser = require('body-parser');
const vnatk = require('./index');

var router = express.Router();

var app = express();
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));

const Models = require('./test/models');

app.use('/vnatk', vnatk({ // "/vnatk" will be your base path where the system will hit for its APIs
    Models: Models,
    router: router
}));

app.get('/', function (req, res) {
    res.status(200).send('ok');
});

var server = app.listen(3000, function () {
});

module.exports = server;