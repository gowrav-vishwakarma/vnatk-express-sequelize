const _ = require('lodash');
const VNATKServerHelpers = require('./helperFunctions/serverside');


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

    router.post('/init', async function (req, res, next) {
        const model = Models[req.body.model];

        var ModelActions = [];

        var returnData = {};

        if (req.body.allowadd) ModelActions = [...ModelActions, ...VNATKServerHelpers.injectAddAction(model, req)];
        if (req.body.allowedit) ModelActions = [...ModelActions, ...VNATKServerHelpers.injectEditAction(model, req)];
        if (req.body.allowdelete) ModelActions = [...ModelActions, ...VNATKServerHelpers.injectDeleteAction(model, req)];
        if (req.body.allowactions) ModelActions = [...ModelActions, ...model.vnAtkGetActions()];
        if (req.body.tableoptions && req.body.tableoptions.headers) {
            var ModelHeaders = VNATKServerHelpers.getHeadersAndDeRef(model, req);
            if (req.body.allowactions) ModelHeaders = [...ModelHeaders, VNATKServerHelpers.injectActionColumn()];
        }

        const { order, group } = VNATKServerHelpers.setupOrderByGroupBy(req.body.tableoptions.modeloptions, req.body.tableoptions.datatableoptions);
        if (order) req.body.tableoptions.modeloptions.order = order

        var data;
        if (req.body.data !== false) {
            // Pginate data
            if (req.body.tableoptions.serversidepagination) {
                const limit = req.body.tableoptions.datatableoptions.itemsPerPage ? req.body.tableoptions.datatableoptions.itemsPerPage : 25;
                const offset = ((req.body.tableoptions.datatableoptions.page ? req.body.tableoptions.datatableoptions.page : 1) - 1) * limit;

                req.body.tableoptions.modeloptions.limit = limit;
                req.body.tableoptions.modeloptions.offset = offset;

                data = await model.findAndCountAll(VNATKServerHelpers.senitizeModelOptions(req.body.tableoptions.modeloptions, model, Models)).catch(err => {
                    res.send(err);
                    res.end();
                });
                if (data) {
                    returnData['datacount'] = data.count;
                    data = data.rows;
                }
            } else {
                // return all data
                data = await model.findAll(VNATKServerHelpers.senitizeModelOptions(req.body.tableoptions.modeloptions, model, Models)).catch(error => {
                    res.status(error.status || 500).send(error);
                    res.end();
                });
            }
            returnData['data'] = data;
        }

        if (req.body.tableoptions && req.body.tableoptions.headers) returnData['headers'] = ModelHeaders;
        if (req.body.allowactions) returnData['actions'] = ModelActions;

        res.send(returnData);
    });

    router.post('/executeaction', async function (req, res, next) {
        const action = req.body.action_to_execute;
        const item = req.body.arg_item;

        const model = Models[req.body.model];

        if (action.name == 'vnatk_add') {
            VNATKServerHelpers.createNew(model, item, VNATKServerHelpers.senitizeModelOptions(req.body.tableoptions.modeloptions, model, Models)).then((cretedRecord) => {
                res.send({ row_data: cretedRecord, message: 'Record added successfully' });
            }).catch(error => {
                res.status(VNATKServerHelpers.getErrorCode(error));
                res.send(error);
                res.end();
            });
        }
        if (action.name == 'vnatk_edit') {
            var editedData = await VNATKServerHelpers.editRecord(model, item, VNATKServerHelpers.senitizeModelOptions(req.body.tableoptions.modeloptions, model, Models)).catch(error => {
                res.status(VNATKServerHelpers.getErrorCode(error));
                res.send(error);
                res.end();
            });
            res.send({ row_data: editedData, message: 'Record edited sucessfully' });
            return;
        }
        if (action.name == 'vnatk_delete') {
            var m_loaded = await model.findByPk(item[model.primaryKeyAttributes[0]], VNATKServerHelpers.senitizeModelOptions(req.body.tableoptions.modeloptions, model, Models)).catch(error => {
                res.status(VNATKServerHelpers.getErrorCode(error));
                res.send(error);
                res.end();
            });
            await m_loaded.destroy();
            res.send({ message: 'Record deleted' });
            return;
        }

        // is it for : Single, multiple, none, all
        var m_loaded = await model.findByPk(item[model.primaryKeyAttributes[0]], VNATKServerHelpers.senitizeModelOptions(req.body.tableoptions.modeloptions, model, Models));
        m_loaded[action.execute]();

        res.send({ row_data: m_loaded });
    })

    router.post('/list', async function (req, res, next) {
        const model = Models[req.body.model];
        const data = await model.findAll(VNATKServerHelpers.senitizeModelOptions(req.body.modeloptions, model, Models));
        res.send(data);
    })

    return router;
};

