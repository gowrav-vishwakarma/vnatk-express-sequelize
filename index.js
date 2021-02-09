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

    router.post('/crud', async function (req, res, next) {
        var model = Models[req.body.model];

        if (!model) {
            res.status(500).send({ error: true, Message: 'Model ' + req.body.model + ' not found' });
            return;
        }

        if (!req.body.read) req.body.read = {};

        if (req.body.read && req.body.read.modelscope !== undefined) {
            if (req.body.read.modelscope == false) model = model.unscoped();
            if (typeof req.body.read.modelscope === 'string') model.scope(req.body.read.modelscope);
        }


        var ModelActions = [];
        var returnData = {};
        if (req.body.read && req.body.read.headers) {
            var ModelHeaders = VNATKServerHelpers.getHeadersAndDeRef(model, req);
            if (req.body.actions) ModelHeaders = [...ModelHeaders, VNATKServerHelpers.injectActionColumn()];
        }

        if (req.body.create !== false) ModelActions = [...ModelActions, ...VNATKServerHelpers.injectAddAction(model, req)];
        if (req.body.update !== false) ModelActions = [...ModelActions, ...VNATKServerHelpers.injectEditAction(model, req)];
        if (req.body.delete !== false) ModelActions = [...ModelActions, ...VNATKServerHelpers.injectDeleteAction(model, req)];
        if (_.has(model, 'vnAtkGetActions') || _.has(model.__proto__, 'vnAtkGetActions')) {
            if (req.body.actions) {
                ModelActions = [...ModelActions, ...model.vnAtkGetActions()];
            }
        }

        var data;
        if (req.body.read.data !== false) {
            const senitizedmodeloptions = VNATKServerHelpers.senitizeModelOptions(req.body.read.modeloptions, model, Models);
            // Paginate data
            if (req.body.read.serversidepagination) {
                senitizedmodeloptions.distinct = true
                data = await model.findAndCountAll(senitizedmodeloptions).catch(error => {
                    res.status(error.status || 500);
                    return next(error);
                    // res.end();
                });
                if (data) {
                    returnData['datacount'] = data.count;
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

        if (req.body.read && req.body.read.headers) returnData['headers'] = ModelHeaders;
        if (req.body.actions) returnData['actions'] = ModelActions;

        res.send(returnData);
    });

    router.post('/executeaction', async function (req, res, next) {
        const action = req.body.action_to_execute;
        const item = req.body.arg_item;

        var model = Models[req.body.model];
        if (req.body.read && req.body.read.modelscope !== undefined) {
            if (req.body.read.modelscope == false) model = model.unscoped();
            if (typeof req.body.read.modelscope === 'string') model.scope(req.body.read.modelscope);
        }

        if (req.body.read && req.body.read.headers) {
            VNATKServerHelpers.getHeadersAndDeRef(model, req);
        }

        var senitizedmodeloptions;
        if (req.body.read) {
            senitizedmodeloptions = VNATKServerHelpers.senitizeModelOptions(req.body.read.modeloptions, model, Models);
        }

        if (action.name == 'vnatk_add') {
            VNATKServerHelpers.createNew(model, item, senitizedmodeloptions).then((cretedRecord) => {
                res.send({ row_data: cretedRecord, message: 'Record added successfully' });
                return;
            }).catch(error => {
                res.status(VNATKServerHelpers.getErrorCode(error));
                // res.send(error);
                // res.end();
                return next(error);
            });
        }
        else if (action.name == 'vnatk_edit') {
            var editedData = await VNATKServerHelpers.editRecord(model, item, senitizedmodeloptions).catch(error => {
                res.status(VNATKServerHelpers.getErrorCode(error));
                throw error;
                // res.send(error);
                // res.end();
                // return next(error);
            });
            res.send({ row_data: editedData, message: 'Record edited sucessfully' });
            return;
        }
        else if (action.name == 'vnatk_delete') {
            var id = item[model.autoIncrementAttribute];
            var where_condition = {};
            where_condition[model.autoIncrementAttribute] = id;
            var m_loaded = await model.unscoped().findOne({ where: where_condition }).catch(error => {
                res.status(VNATKServerHelpers.getErrorCode(error));
                throw error;
            });
            await m_loaded.destroy().catch(error => {
                res.status(VNATKServerHelpers.getErrorCode(error));
                throw error;
            });
            res.send({ message: 'Record deleted' });
            return;
        } else {
            // is it for : Single, multiple, none, all
            var m_loaded = await model.unscoped();

            if (item && item[model.autoIncrementAttribute])
                var m_loaded = await m_loaded.findByPk(item[model.autoIncrementAttribute], senitizedmodeloptions);

            if (req.body.formdata)
                var response = m_loaded[action.execute](req.body.formdata);
            else
                m_loaded[action.execute]();

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

