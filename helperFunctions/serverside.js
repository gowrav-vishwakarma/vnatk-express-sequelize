const VNATKClientHelpers = require("./clientside");
const _ = require('lodash');
const sequelize = require('sequelize')
const Op = sequelize.Op

const operators = { $eq: '', $ne: '', $gte: '', $gt: '', $lte: '', $lt: '', $not: '', $is: '', $in: '', $notIn: '', $like: '', $notLike: '', $viLike: '', $notILike: '', $startsWith: '', $endsWith: '', $substring: '', $regexp: '', $notRegexp: '', $iRegexp: '', $notIRegexp: '', $between: '', $notBetween: '', $overlap: '', $contains: '', $contained: '', $adjacent: '', $strictLeft: '', $strictRight: '', $noExtendRight: '', $noExtendLeft: '', $and: '', $or: '', $any: '', $all: '', $values: '', $col: '', $placeholder: '', $join: '' };

module.exports = {

    replaceOperators(object, k, v) {

        switch (k) {
            case '$eq':
                delete object[k];
                return object[Op.eq] = v;
            case '$ne':
                delete object[k];
                return object[Op.ne] = v;
            case '$gte':
                delete object[k];
                return object[Op.gte] = v;
            case '$gt':
                delete object[k];
                return object[Op.gt] = v;
            case '$lte':
                delete object[k];
                return object[Op.lte] = v;
            case '$lt':
                delete object[k];
                return object[Op.lt] = v;
            case '$not':
                delete object[k];
                return object[Op.not] = v;
            case '$is':
                delete object[k];
                return object[Op.is] = v;
            case '$in':
                delete object[k];
                return object[Op.in] = v;
            case '$notIn':
                delete object[k];
                return object[Op.notIn] = v;
            case '$like':
                delete object[k];
                return object[Op.like] = v;
            case '$notLike':
                delete object[k];
                return object[Op.notLike] = v;
            case '$viLike':
                delete object[k];
                return object[Op.viLike] = v;
            case '$notILike':
                delete object[k];
                return object[Op.notILike] = v;
            case '$startsWith':
                delete object[k];
                return object[Op.startsWith] = v;
            case '$endsWith':
                delete object[k];
                return object[Op.endsWith] = v;
            case '$substring':
                delete object[k];
                return object[Op.substring] = v;
            case '$regexp':
                delete object[k];
                return object[Op.regexp] = v;
            case '$notRegexp':
                delete object[k];
                return object[Op.notRegexp] = v;
            case '$iRegexp':
                delete object[k];
                return object[Op.iRegexp] = v;
            case '$notIRegexp':
                delete object[k];
                return object[Op.notIRegexp] = v;
            case '$between':
                delete object[k];
                return object[Op.between] = v;
            case '$notBetween':
                delete object[k];
                return object[Op.notBetween] = v;
            case '$overlap':
                delete object[k];
                return object[Op.overlap] = v;
            case '$contains':
                delete object[k];
                return object[Op.contains] = v;
            case '$contained':
                delete object[k];
                return object[Op.contained] = v;
            case '$adjacent':
                delete object[k];
                return object[Op.adjacent] = v;
            case '$strictLeft':
                delete object[k];
                return object[Op.strictLeft] = v;
            case '$strictRight':
                delete object[k];
                return object[Op.strictRight] = v;
            case '$noExtendRight':
                delete object[k];
                return object[Op.noExtendRight] = v;
            case '$noExtendLeft':
                delete object[k];
                return object[Op.noExtendLeft] = v;
            case '$and':
                delete object[k];
                return object[Op.and] = v;
            case '$or':
                delete object[k];
                return object[Op.or] = v;
            case '$any':
                delete object[k];
                return object[Op.any] = v;
            case '$all':
                delete object[k];
                return object[Op.all] = v;
            case '$values':
                delete object[k];
                return object[Op.values] = v;
            case '$col':
                delete object[k];
                return object[Op.col] = v;
            case '$placeholder':
                delete object[k];
                return object[Op.placeholder] = v;
            case '$join':
                delete object[k];
                return object[Op.join] = v;
        }
    },

    replaceIncludeToObject(obj, Models) {
        if (Array.isArray(obj)) {
            for (let index = 0; index < obj.length; index++) {
                const element = obj[index];
                module.exports.replaceIncludeToObject(element, Models);
                if (typeof element == 'object' && _.has(element, 'fn')) {
                    obj[index] = [Models.sequelize.fn(element.fn, element.col), element.as];
                }
            }
        } else if (typeof (obj) === 'object') {
            for (const [key, value] of Object.entries(obj)) {
                if (key == 'model') {
                    // handle scopes from text
                    obj.model = Models[value];
                    if (_.has(obj, 'scope')) {
                        if (obj.scope === false) {
                            obj.model = obj.model.unscoped()
                        } else {
                            obj.model = obj.model.scope(obj.scope)
                        }
                    }
                }

                if (_.keys(operators).includes(key)) {
                    module.exports.replaceOperators(obj, key, value);
                }

                if (typeof (value) === 'object') {
                    module.exports.replaceIncludeToObject(value, Models);
                }
            }
        }
    },

    senitizeModelOptions(options, model, Models) {
        if (_.has(options, 'attributes') && !options.attributes.includes(model.autoIncrementAttribute)) {
            options.attributes.push(model.autoIncrementAttribute);
        }
        module.exports.replaceIncludeToObject(options, Models);
        return options;
    },



    getHeadersAndDeRef: function (model, req, Models) {
        const associations = VNATKClientHelpers.getAssociations(model);
        var fields = undefined;
        if (req.body.read && req.body.read.modeloptions && req.body.read.modeloptions.attributes) fields = req.body.read.modeloptions.attributes;


        var fields_info = model.rawAttributes;
        if (!fields || fields == undefined || fields == null || fields == '' || fields == '*' || fields.length == 0) {
            fields = _.keys(fields_info);
        }

        if (!fields.includes(model.autoIncrementAttribute)) {
            fields.push(model.autoIncrementAttribute);
        }

        // No attribute defined, lets define idfield and all fields in attribute by our self here
        if (req.body.read && req.body.read.modeloptions && !req.body.read.modeloptions.attributes)
            req.body.read.modeloptions.attributes = fields;

        if (req.body.read && req.body.read.modeloptions && req.body.read.modeloptions.attributes && !req.body.read.modeloptions.attributes.includes(model.autoIncrementAttribute)) {
            req.body.read.modeloptions.attributes.push(model.autoIncrementAttribute);
        }


        var field_headers = [];

        for (let i = 0; i < fields.length; i++) {
            const fld = fields[i];
            if (fld == model.autoIncrementAttribute) {
                field_headers.push({
                    text: model.autoIncrementAttribute,
                    value: model.autoIncrementAttribute,
                    sortable: true,
                    isIdField: true,
                    hide: true
                })
                continue;
            }
            if (Array.isArray(fld) || typeof fld === 'object') continue; // mostly looks aggregate functions object
            const assosIndex = associations.findIndex(o => o.foreignKey == fields_info[fld].fieldName);
            if (req.body.read && req.body.read.autoderef && assosIndex > -1) {
                // ASSOCIATION found, belongsTo field
                field_headers.push({
                    text: associations[assosIndex].name.singular,
                    value: associations[assosIndex].name.singular + '.' + (Models[associations[assosIndex].model].titlefield ? Models[associations[assosIndex].model].titlefield : 'name'), //TODO get titlefield from model
                    sortable: fields_info[fld].sortable ? fields_info[fld].sortable : true,
                })
                // TODO add in model include if not set
                if (!req.body.read.modeloptions.include) req.body.read.modeloptions.include = [];
                inArrayAsString = req.body.read.modeloptions.include.includes(associations[assosIndex].name.singular);
                inArrayAsObjectInclude = req.body.read.modeloptions.include.findIndex(o => (o.model == associations[assosIndex].name.singular) || (o.as && o.as == associations[assosIndex].name.singular));
                if (!inArrayAsString && inArrayAsObjectInclude == -1) {
                    req.body.read.modeloptions.include.push(associations[assosIndex].as ? associations[assosIndex].as : associations[assosIndex].name.singular);
                }

            } else {
                field_headers.push({
                    text: fields_info[fld].caption ? fields_info[fld].caption : fields_info[fld].fieldName,
                    value: fields_info[fld].fieldName,
                    sortable: fields_info[fld].sortable ? fields_info[fld].sortable : true,
                    primaryKey: fields_info[fld].primaryKey ? true : undefined,
                })
            }
        }

        return field_headers;
    },

    createNew: async function (model, data, readModelOptions) {
        const item = await model.create(data).catch(error => {
            throw error;
        });


        id = item[model.autoIncrementAttribute];
        var where_condition = {};
        where_condition[model.autoIncrementAttribute] = id;
        readModelOptions.where = where_condition;

        var m_loaded = await model.unscoped().findOne(readModelOptions);
        return m_loaded;
    },

    editRecord: async function (model, item, readModelOptions) {
        id = item[model.autoIncrementAttribute];
        delete item[model.autoIncrementAttribute];
        var where_condition = {};
        where_condition[model.autoIncrementAttribute] = id;
        const updated = await model.update(item, { where: where_condition }).catch(error => {
            throw error;
        });
        readModelOptions.where = where_condition;
        var m_loaded = await model.findOne(readModelOptions);
        return m_loaded;
    },

    injectAddAction: function (model, req, Models) {
        var addFields = undefined;
        if (req.body.create && req.body.create.modeloptions && req.body.create.modeloptions.attributes) addFields = req.body.create.modeloptions.attributes;
        var addAction = {
            name: 'vnatk_add',
            caption: 'Add',
            type: 'NoRecord',

            formschema: VNATKClientHelpers.generateFormSchemaFromModel(model, addFields, Models)
        }
        return [addAction];
    },

    injectEditAction: function (model, req, Models) {
        var editFields = undefined;
        if (req.body.update && req.body.update.modeloptions && req.body.update.modeloptions.attributes) editFields = req.body.update.modeloptions.attributes;
        var editAction = {
            name: 'vnatk_edit',
            caption: 'Edit',
            type: 'single',
            placeIn: 'buttonGroup',
            formschema: VNATKClientHelpers.generateFormSchemaFromModel(model, editFields, Models)
        }
        return [editAction];
    },

    injectDeleteAction: function (model, req, Models) {
        var deleteAction = {
            name: 'vnatk_delete',
            caption: 'Delete',
            type: 'single',
            placeIn: 'buttonGroup',
            formschema: {
                confirm: {
                    type: "checkbox",
                    label: "I am sure to delete this record.",
                    color: "red",
                    defaultValue: true
                }
            }
        }
        return [deleteAction];
    },

    async vnatkAutoImport(model, resbody, Models) {
        var importdata = resbody.importdata;
        // console.log('importdata', importdata);
        var transaction_mode = resbody.transaction.toLowerCase();
        var transaction = null;
        try {
            if (transaction_mode === 'file') {
                transaction = await model.sequelize.transaction();
            }
            // Actual import code

            for (let index = 0; index < importdata.length; index++) {
                const item = importdata[index];
                try {
                    if (transaction_mode === 'row') transaction = await model.sequelize.transaction();
                    // Importing root level item
                    console.log('importing ', item)
                    await module.exports.AutoImportItem(model, item, Models).catch(err => { throw err });
                    if (transaction_mode === 'row') await transaction.commit();
                } catch (err) {
                    if (transaction_mode === 'row') {
                        await transaction.rollback();
                        throw err;
                    }
                    if (transaction_mode === 'file') {
                        throw err;
                    }
                }
            }
            if (transaction_mode === 'file') await transaction.commit();
        } catch (err) {
            if (transaction_mode === 'file') await transaction.rollback();
            throw err
        }

    },

    async AutoImportItem(model, item, Models, AdditionalWhere = {}, relation = 'none') {
        if (_.has(item, 'assignedOn')) {
            let x = 2;
        }
        var item_orig = JSON.parse(JSON.stringify(item));

        let $vnatk_data_handle = 'alwaysCreate';
        let $vnatk_find_options = {};
        let $vnatk_cache_records = true;
        let $vnatk_update_data = {};

        if (item.$vnatk_data_handle) { $vnatk_data_handle = item.$vnatk_data_handle; delete item.$vnatk_data_handle };
        if (item.$vnatk_find_options) { $vnatk_find_options = item.$vnatk_find_options; delete item.$vnatk_find_options };
        if (item.$vnatk_cache_records) { $vnatk_cache_records = item.$vnatk_cache_records; delete item.$vnatk_cache_records };
        if (item.$vnatk_update_data) { $vnatk_update_data = item.$vnatk_update_data; delete item.$vnatk_update_data };
        if (item.$vnatk_find_options) { $vnatk_find_options = item.$vnatk_find_options; delete item.$vnatk_find_options };

        if ($vnatk_find_options.modelscope) {
            if (modelscope === false)
                model = model.unscoped();
            else
                model = model.scope($vnatk_find_options.modelscope);
        }

        // Fetch belongsTo, hasMany and belongsToMany separate and just leave the data for the Model/Table
        const associations = VNATKClientHelpers.getAssociations(model);
        let itemBelongsTo = associations.filter(r => r.associationType === 'BelongsTo');
        itemBelongsTo = itemBelongsTo.map(i => { if (!i.as) i.as = i.name.singular; return i });

        let itemHasMany = associations.filter(r => r.associationType === 'HasMany');
        itemHasMany = itemHasMany.map(i => { if (!i.as) i.as = i.name.plural; return i });

        let itemBelongsToMany = associations.filter(r => r.associationType === 'BelongsToMany');
        itemBelongsToMany = itemBelongsToMany.map(i => { if (!i.as) i.as = i.name.plural; return i });

        // console.log('associations', associations);

        // perform the same recursive with belongsTo first and save their foreignKeys for this table
        for (let index = 0; index < itemBelongsTo.length; index++) {
            let item_belongsto_relation = itemBelongsTo[index];
            if (_.has(item_orig, item_belongsto_relation.as)) {
                itemBelongsTo[index]['item'] = await module.exports.AutoImportItem(Models[item_belongsto_relation.model], item_orig[item_belongsto_relation.as], Models).catch(err => { throw err });
                item[item_belongsto_relation.foreignKey] = itemBelongsTo[index]['item'][model.autoIncrementAttribute];
                if (!$vnatk_find_options.modeloptions || $vnatk_find_options.modeloptions[item_belongsto_relation.foreignKey] !== false)
                    AdditionalWhere[item_belongsto_relation.foreignKey] = item[item_belongsto_relation.foreignKey];
                delete item[item_belongsto_relation.as];
            }
        }
        // console.log('itemBelongsTo', itemBelongsTo);

        // get belongsToMany item ready by solving all other models, once we save thismdoel we will fill our ID and run the loop again
        for (let index = 0; index < itemBelongsToMany.length; index++) {
            let thisbelongstomanyrelation = itemBelongsToMany[index];
            if (_.has(item_orig, thisbelongstomanyrelation.as)) {
                delete item[thisbelongstomanyrelation.as];
            }
        }
        // console.log('itemBelongsToMany', itemBelongsToMany);

        for (let index = 0; index < itemHasMany.length; index++) {
            const thishasmanyrelation = itemHasMany[index];
            if (_.has(item_orig, thishasmanyrelation.as)) {
                delete item[thishasmanyrelation.as];
            }
        }
        // console.log('itemHasMany', itemHasMany);

        // do the data for this model, received the ids: Clean everything that do not belongs to model fields first
        item = _.pick(item, _.map(model.rawAttributes, 'fieldName'));
        let senitizedmodeloptions = Object.assign({}, item);
        if ($vnatk_find_options.modeloptions) {
            senitizedmodeloptions = module.exports.senitizeModelOptions($vnatk_find_options.modeloptions, model, Models);
        }
        senitizedmodeloptions = Object.assign(senitizedmodeloptions, AdditionalWhere);
        if (relation === 'BelongsToMany' && !$vnatk_find_options.modeloptions) {
            senitizedmodeloptions = AdditionalWhere;
        }
        let t = undefined;

        switch ($vnatk_data_handle.toLowerCase()) {
            case 'alwayscreate':
                item = await model.create(item, { logging: console.log }).catch(err => {
                    throw err
                });
                break;
            case 'findorcreate':
                t = await model.findOne({ where: senitizedmodeloptions }).catch(err => {
                    throw err
                });
                if (!t) {
                    t = await model.create(item, { logging: console.log }).catch(err => {
                        throw err
                    });
                }
                item = t;
                break;
            case 'findandupdateorcreate':
                t = await model.findOne({ where: senitizedmodeloptions }).catch(err => {
                    throw err
                });
                if (!t) {
                    t = await model.create(item, { logging: console.log }).catch(err => {
                        throw err
                    });
                } else {
                    let updateReqruied = false;
                    for (const [field, value] of Object.entries(item)) {
                        if (item[field] !== t.get(field)) {
                            t.set(field, value);
                            updateReqruied = true;
                        }
                    }
                    if (updateReqruied) t = await t.save().catch(err => {
                        throw err
                    });
                }
                item = t;
                break;
            case 'findtoassociate':
                t = await model.findOne({ where: senitizedmodeloptions }).catch(err => {
                    throw err
                });
                if (t)
                    item = t;
                else {
                    console.log('findtoassociate where condition ', { where: senitizedmodeloptions });
                    throw new Error(JSON.stringify(item) + ' not found');
                }
                break;
            case 'associateiffound':
                t = await model.findOne({ where: senitizedmodeloptions }).catch(err => {
                    throw err
                });
                if (t)
                    item = t
                break;
            default:
                throw new Error($vnatk_data_handle + ' is not accepted value at ' + JSON.stringify(item))
        }

        for (let index = 0; index < itemHasMany.length; index++) {
            const thishasmanyrelation = itemHasMany[index];
            if (_.has(item_orig, thishasmanyrelation.as)) {
                for (let j = 0; j < item_orig[thishasmanyrelation.as].length; j++) {
                    let thisitemdetails = item_orig[thishasmanyrelation.as][j];
                    let id_merge = {};
                    id_merge[thishasmanyrelation.foreignKey] = item[model.autoIncrementAttribute];
                    thisitemdetails = Object.assign(thisitemdetails, id_merge);
                    let AddWhere = id_merge;
                    // if (thisitemdetails.$vnatk_find_options && thisitemdetails.$vnatk_find_options.modeloptions && thisitemdetails.$vnatk_find_options.modeloptions[thisbelongstomanyrelation.foreignKey] === false) {
                    //     let AddWhere = {};
                    // }
                    await module.exports.AutoImportItem(Models[thishasmanyrelation.model], thisitemdetails, Models, AddWhere).catch(err => { throw err })
                }
                delete item[thishasmanyrelation.as];
            }
        }
        // console.log('itemHasMany', itemHasMany);

        // do the hasMany and belongsToMany now
        // get belongsToMany item ready by solving all other models, once we save thismdoel we will fill our ID and run the loop again
        for (let index = 0; index < itemBelongsToMany.length; index++) {
            let thisbelongstomanyrelation = itemBelongsToMany[index];
            if (_.has(item_orig, thisbelongstomanyrelation.as)) {
                for (let j = 0; j < item_orig[thisbelongstomanyrelation.as].length; j++) {
                    let thisitemdetails = item_orig[thisbelongstomanyrelation.as][j];
                    let id_merge = {};
                    id_merge[thisbelongstomanyrelation.foreignKey] = item[model.autoIncrementAttribute];
                    thisitemdetails = Object.assign(thisitemdetails, id_merge);
                    let AddWhere = id_merge;
                    // if (thisitemdetails.$vnatk_find_options && thisitemdetails.$vnatk_find_options.modeloptions && thisitemdetails.$vnatk_find_options.modeloptions[thisbelongstomanyrelation.foreignKey] === false) {
                    //     AddWhere = {};
                    // }
                    await module.exports.AutoImportItem(Models[thisbelongstomanyrelation.through.model], thisitemdetails, Models, AddWhere, 'BelongsToMany').catch(err => { throw err });
                }
                delete item[thisbelongstomanyrelation.as];
            }
        }
        // console.log('itemBelongsToMany', itemBelongsToMany);
        return item;
    },

    injectActionColumn() {
        return {
            text: 'Actions',
            value: 'vnatk_actions',
            sortable: false
        };
    },

    getErrorCode(error) {
        if (error.name == 'SequelizeValidationError') {
            return 422;
        }
        return 500;
    }

}