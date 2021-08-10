const _ = require('lodash');
const VNATKServerHelpers = require('./helperFunctions/serverside');
const modelDesigner = require('./modelDesigner');


/**
 * Middleware to setup VNATK sequelize backend
 * @param {*} options 
 * {
 *  basepath: defaults "/crud"
 * }
 */
module.exports = function (options) {
    if ((typeof options.Models) !== 'object') {
        throw new Error('You must pass Models from sequelize to use, mostly you do this by "const Models = require(\'../ models\');" in your app');
    }
    if (!options.router) {
        throw new Error('you must pass router like "router : express.Router()" in options');
    }


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

    router.post('/crud', async function (req, res, next) {
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
    });

    router.post('/executeaction', async function (req, res, next) {
        var action = req.body.action_to_execute;
        if (typeof action === 'string' || action instanceof String) action = { name: action, execute: action }
        const item = req.body.arg_item;

        var model = Models[req.body.model];
        if (req.body.modelscope !== undefined) {
            if (req.body.modelscope == false) model = model.unscoped();
            if (typeof req.body.modelscope === 'string') model = model.scope(req.body.modelscope);
        }

        if (req.body.read && req.body.read.modelscope !== undefined) {
            if (req.body.read.modelscope == false) model = model.unscoped();
            else if (typeof req.body.read.modelscope !== undefined) model = model.scope(req.body.read.modelscope);
        }

        if (req.body.read && req.body.read.headers) {
            VNATKServerHelpers.getHeadersAndDeRef(model, req, Models);
        }

        var senitizedmodeloptions = {};
        if (req.body.read) {
            senitizedmodeloptions = VNATKServerHelpers.senitizeModelOptions(req.body.read.modeloptions, model, Models);
        }

        if (allowCreate && action.name == 'vnatk_add') {
            if (beforeExecute && (await Promise.resolve(beforeExecute(model, action.name, req, res, next))) === false) return;

            if (_.has(model, 'can_vnatk_add') || _.has(model.__proto__, 'can_vnatk_add')) {
                if (model.can_vnatk_add(req) !== true) {
                    res.status(500).send({ error: true, Message: 'Adding on model ' + req.body.model + ' is not allowed by authorization functions' });
                    return;
                }
            }
            VNATKServerHelpers.createNew(model, item, senitizedmodeloptions).then(async (createdRecord) => {
                if (afterExecute) await Promise.resolve(afterExecute(res, model, 'vnatk_add', createdRecord));
                res.send({ row_data: createdRecord, message: 'Record added successfully' });
                return;
            }).catch(error => {
                res.status(VNATKServerHelpers.getErrorCode(error));
                // res.send(error);
                // res.end();
                return next(error);
            });
        }
        else if (allowUpdate && action.name == 'vnatk_edit') {
            if (_.has(model, 'can_vnatk_edit') || _.has(model.__proto__, 'can_vnatk_edit')) {
                if (model.can_vnatk_edit(req) !== true) {
                    res.status(500).send({ error: true, Message: 'Editing on model ' + req.body.model + ' is not allowed by authorization functions' });
                    return;
                }
            }

            var editedData = await VNATKServerHelpers.editRecord(model, item, senitizedmodeloptions, req, res, next, beforeExecute).catch(error => {
                res.status(VNATKServerHelpers.getErrorCode(error));
                throw error;
                // res.send(error);
                // res.end();
                // return next(error);
            });
            if (afterExecute) await Promise.resolve(afterExecute(res, model, 'vnatk_edit', editedData));
            res.send({ row_data: editedData, message: 'Record edited sucessfully' });
            return;
        }
        else if (allowDelete && action.name == 'vnatk_delete') {
            if (_.has(model, 'can_vnatk_delete') || _.has(model.__proto__, 'can_vnatk_delete')) {
                if (model.can_vnatk_delete(req) !== true) {
                    res.status(500).send({ error: true, Message: 'Deleting on model ' + req.body.model + ' is not allowed by authorization functions' });
                    return;
                }
            }
            var id = item[model.autoIncrementAttribute];
            var where_condition = {};
            where_condition[model.autoIncrementAttribute] = id;
            var m_loaded = await model.unscoped().findOne({ where: where_condition }).catch(error => {
                res.status(VNATKServerHelpers.getErrorCode(error));
                throw error;
            });
            if (beforeExecute && (await Promise.resolve(beforeExecute(m_loaded, action.name, req, res, next))) === false) return;
            await m_loaded.destroy().catch(error => {
                res.status(VNATKServerHelpers.getErrorCode(error));
                throw error;
            });
            if (afterExecute) await Promise.resolve(afterExecute(res, model, 'vnatk_delete', where_condition));

            res.send({ message: 'Record deleted' });
            return;
        } else if (allowImport && action.name == 'vnatk_autoimport') {
            if (_.has(model, 'can_vnatk_autoimport') || _.has(model.__proto__, 'can_vnatk_autoimport')) {
                if (model.can_vnatk_autoimport(req) !== true) {
                    res.status(500).send({ error: true, Message: 'AutoImporting on model ' + req.body.model + ' is not allowed by authorization functions' });
                    return;
                }
            }
            if (beforeExecute && (await Promise.resolve(beforeExecute(model, action.name, req, res, next))) === false) return;

            var response = await VNATKServerHelpers.vnatkAutoImport(model, req.body, Models)
                .catch(error => {
                    res.status(VNATKServerHelpers.getErrorCode(error));
                    return next(error);
                });
            if (afterExecute) await Promise.resolve(afterExecute(res, model, 'vnatk_autoimport', response));

            res.send({ message: 'Import done', response: response });
            return
        } else {
            if (!allowActions && (_.has(model, 'can_' + action.execute) || _.has(model.__proto__, 'can_' + action.execute))) {
                if (model['can_' + action.execute](req) !== true) {
                    res.status(500).send({ error: true, Message: 'Executing ' + action.execute + ' on model ' + req.body.model + ' is not allowed by authorization functions' });
                    return;
                }
            }
            // is it for : Single, multiple, none, all
            var m_loaded = await model.unscoped();

            if (item && item[model.autoIncrementAttribute]) {
                // console.log('loading by id');
                var m_loaded = await m_loaded.findByPk(item[model.autoIncrementAttribute], senitizedmodeloptions);
            }

            if (beforeExecute && (await Promise.resolve(beforeExecute(m_loaded, action.name, req, res, next))) === false) return;

            var response = undefined;
            if (req.body.formdata)
                response = m_loaded[action.execute](req.body.formdata);
            else if (req.body.importdata)
                response = m_loaded[action.execute](req.body.importdata);
            else
                response = m_loaded[action.execute](req.body.arg_item);

            response = await Promise.resolve(response);
            if (afterExecute) await Promise.resolve(afterExecute(res, model, action.execute, response));

            res.send({ row_data: response ? response : m_loaded });
        }
    })

    router.get('/modeldesigner', function (req, res, next) {
        modelDesigner.init(req, res, next, Models)
    }
    );
    router.post('/modeldesigner/save', function (req, res, next) {
        modelDesigner.save(req, res, next, Models)
    }
    );

    return router;
};

