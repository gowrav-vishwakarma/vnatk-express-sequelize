const _ = require('lodash');
const VNATKServerHelpers = require('./helperFunctions/serverside');

module.exports = async function (req, res, next, options) {

    const Models = options.Models;
    const router = options.router;
    const allowRead = options.read === undefined ? true : options.read;
    const allowCreate = options.create === undefined ? true : options.create;
    const allowUpdate = options.update === undefined ? true : options.update;
    const allowDelete = options.delete === undefined ? true : options.delete;
    const allowImport = options.import === undefined ? true : options.import;
    const allowActions = options.actions === undefined ? true : options.actions;
    const beforeExecute = options.beforeExecute === undefined ? false : options.beforeExecute;
    const afterExecute = options.afterExecute === undefined ? false : options.afterExecute;

    
    var model = Models[req.body.model];
    const skipIdInsert = req.body.actions !== undefined && req.body.actions === false;

    if (
        (_.has(options, 'whitelistmodels') && !options.whitelistmodels.includes(req.body.model))
        || (_.has(options, 'blacklistmodels') && options.blacklistmodels.includes(req.body.model))
    ) {
        res.status(500).send({ error: true, Message: 'Model ' + req.body.model + ' is not allowed to process' });
        return
    }

    if (!model) {
        res.status(500).send({ error: true, Message: 'Model ' + req.body.model + ' not found' });
        return;
    }

    if (!req.body.read) req.body.read = {};

    if (req.body.read && req.body.read.modelscope !== undefined) {
        if (req.body.read.modelscope == false) model = model.unscoped();
        else if (typeof req.body.read.modelscope !== undefined) model = model.scope(req.body.read.modelscope);
    }

    if (beforeExecute && (await Promise.resolve(beforeExecute(model, 'crud', req, res, next))) === false) return;

    var ModelActions = [];
    var returnData = {};
    if (req.body.read && req.body.read.headers) {
        var ModelHeaders = VNATKServerHelpers.getHeadersAndDeRef(model, req, Models, skipIdInsert);
        if (req.body.actions) ModelHeaders = [...ModelHeaders, VNATKServerHelpers.injectActionColumn()];
    }

    if (req.body.create !== false) ModelActions = [...ModelActions, ...VNATKServerHelpers.injectAddAction(model, req, Models)];
    if (req.body.update !== false) ModelActions = [...ModelActions, ...VNATKServerHelpers.injectEditAction(model, req, Models)];
    if (req.body.delete !== false) ModelActions = [...ModelActions, ...VNATKServerHelpers.injectDeleteAction(model, req, Models)];
    if (_.has(model, 'vnAtkGetActions') || _.has(model.__proto__, 'vnAtkGetActions')) {
        if (req.body.actions) {
            ModelActions = [...ModelActions, ...model.vnAtkGetActions()];
        }
    }

    var data;
    if (allowRead && req.body.read.data !== false) {
        var senitizedmodeloptions = VNATKServerHelpers.senitizeModelOptions(req.body.read.modeloptions, model, Models, skipIdInsert);
        // console.log('senitizedmodeloptions', senitizedmodeloptions);
        // Paginate data
        if (req.body.read.serversidepagination) {
            senitizedmodeloptions.distinct = true
            data = await model.findAndCountAll(senitizedmodeloptions).catch(error => {
                res.status(error.status || 500);
                return next(error);
                // res.end();
            });
            if (data) {
                returnData['datacount'] = Array.isArray(data.count) ? data.count.count : data.count;
                data = data.rows;
            }
        } else {
            // return all data
            data = await model.findAll(senitizedmodeloptions).catch(error => {
                res.status(error.status || 500);
                return next(error);
                // res.end();
            });
        }
        returnData['data'] = data;
    }

    if (allowRead && req.body.read && req.body.read.headers) returnData['headers'] = ModelHeaders;
    if (req.body.actions) returnData['actions'] = ModelActions;

    if (afterExecute) await Promise.resolve(afterExecute(res, model, 'crud', returnData));

    res.send(returnData);
};