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

    router.post('/crud', async function (req, res, next) {
        const model = Models[req.body.model];

        if (req.body.retrive && req.body.retrive.modelscope !== undefined) {
            if (req.body.retrive.modelscope == false) model.unscoped();
            if (typeof req.body.retrive.modelscope === 'string') model.scope(req.body.retrive.modelscope);
        }

        var ModelActions = [];
        var returnData = {};
        if (req.body.create !== false) ModelActions = [...ModelActions, ...VNATKServerHelpers.injectAddAction(model, req)];
        if (req.body.update !== false) ModelActions = [...ModelActions, ...VNATKServerHelpers.injectEditAction(model, req)];
        if (req.body.delete !== false) ModelActions = [...ModelActions, ...VNATKServerHelpers.injectDeleteAction(model, req)];
        if (req.body.actions) ModelActions = [...ModelActions, ...model.vnAtkGetActions()];
        if (req.body.retrive && req.body.retrive.headers) {
            var ModelHeaders = VNATKServerHelpers.getHeadersAndDeRef(model, req);
            if (req.body.actions) ModelHeaders = [...ModelHeaders, VNATKServerHelpers.injectActionColumn()];
        }

        var data;
        if (req.body.retrive.data !== false) {
            const senitizedmodeloptions = VNATKServerHelpers.senitizeModelOptions(req.body.retrive.modeloptions, model, Models);
            // Pginate data
            if (req.body.retrive.serversidepagination) {

                data = await model.findAndCountAll(senitizedmodeloptions).catch(err => {
                    res.send(err);
                    res.end();
                });
                if (data) {
                    returnData['datacount'] = data.count;
                    data = data.rows;
                }
            } else {
                // return all data
                data = await model.findAll(senitizedmodeloptions).catch(error => {
                    res.status(error.status || 500).send(error);
                    res.end();
                });
            }
            returnData['data'] = data;
        }

        if (req.body.retrive && req.body.retrive.headers) returnData['headers'] = ModelHeaders;
        if (req.body.actions) returnData['actions'] = ModelActions;

        res.send(returnData);
    });

    router.post('/executeaction', async function (req, res, next) {
        const action = req.body.action_to_execute;
        const item = req.body.arg_item;

        const model = Models[req.body.model];
        if (req.body.retrive && req.body.retrive.modelscope !== undefined) {
            if (req.body.retrive.modelscope == false) model.unscoped();
            if (typeof req.body.retrive.modelscope === 'string') model.scope(req.body.retrive.modelscope);
        }
        const senitizedmodeloptions = VNATKServerHelpers.senitizeModelOptions(req.body.retrive.modeloptions, model, Models);


        if (action.name == 'vnatk_add') {
            VNATKServerHelpers.createNew(model, item, senitizedmodeloptions).then((cretedRecord) => {
                res.send({ row_data: cretedRecord, message: 'Record added successfully' });
            }).catch(error => {
                res.status(VNATKServerHelpers.getErrorCode(error));
                res.send(error);
                res.end();
            });
        }
        if (action.name == 'vnatk_edit') {
            var editedData = await VNATKServerHelpers.editRecord(model, item, senitizedmodeloptions).catch(error => {
                res.status(VNATKServerHelpers.getErrorCode(error));
                res.send(error);
                res.end();
            });
            res.send({ row_data: editedData, message: 'Record edited sucessfully' });
            return;
        }
        if (action.name == 'vnatk_delete') {
            var m_loaded = await model.findByPk(item[model.primaryKeyAttributes[0]], senitizedmodeloptions).catch(error => {
                res.status(VNATKServerHelpers.getErrorCode(error));
                res.send(error);
                res.end();
            });
            await m_loaded.destroy();
            res.send({ message: 'Record deleted' });
            return;
        }

        // is it for : Single, multiple, none, all
        var m_loaded = await model.findByPk(item[model.primaryKeyAttributes[0]], senitizedmodeloptions);
        if (action.formschema)
            m_loaded[action.execute](req.body.formdata);
        else
            m_loaded[action.execute]();

        res.send({ row_data: m_loaded });
    })

    // router.post('/autocomplete', async function (req, res, next) {
    //     const model = Models[req.body.model];
    //     const senitizedmodeloptions = VNATKServerHelpers.senitizeModelOptions(req.body.tableoptions.modeloptions, model, Models);
    //     const data = await model.findAll(senitizedmodeloptions);
    //     res.send(data);
    // })

    return router;
};

