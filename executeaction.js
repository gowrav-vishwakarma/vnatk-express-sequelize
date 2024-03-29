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

        if (req.body.read && req.body.read.modeloptions && req.body.read.modeloptions.limit) {
            delete req.body.read.modeloptions.limit;
            if (req.body.read.modeloptions.offset)
                delete req.body.read.modeloptions.offset;
        }

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
                m_loaded = await m_loaded.findByPk(item[model.autoIncrementAttribute], senitizedmodeloptions);
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
    }