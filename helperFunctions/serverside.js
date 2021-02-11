const VNATKClientHelpers = require("../helperFunctions/clientside");
const _ = require('lodash');
const sequelize = require('sequelize')
const Op = sequelize.Op

const operators = { $eq: '', $ne: '', $gte: '', $gt: '', $lte: '', $lt: '', $not: '', $is: '', $in: '', $notIn: '', $like: '', $notLike: '', $viLike: '', $notILike: '', $startsWith: '', $endsWith: '', $substring: '', $regexp: '', $notRegexp: '', $iRegexp: '', $notIRegexp: '', $between: '', $notBetween: '', $overlap: '', $contains: '', $contained: '', $adjacent: '', $strictLeft: '', $strictRight: '', $noExtendRight: '', $noExtendLeft: '', $and: '', $or: '', $any: '', $all: '', $values: '', $col: '', $placeholder: '', $join: '' };

module.exports = {

    replaceOperators(object) {
        return Array.isArray(object)
            ? object.map(module.exports.replaceOperators)
            : object && typeof object === 'object'
                ? Object.fromEntries(Object
                    .entries(object)
                    .map(([k, v]) => {
                        if (k in operators) {
                            switch (k) {
                                case '$eq':
                                    delete object[k];
                                    return [object[Op.eq] = v];
                                case '$ne':
                                    delete object[k];
                                    return [object[Op.ne] = v];
                                case '$gte':
                                    delete object[k];
                                    return [object[Op.gte] = v];
                                case '$gt':
                                    delete object[k];
                                    return [object[Op.gt] = v];
                                case '$lte':
                                    delete object[k];
                                    return [object[Op.lte] = v];
                                case '$lt':
                                    delete object[k];
                                    return [object[Op.lt] = v];
                                case '$not':
                                    delete object[k];
                                    return [object[Op.not] = v];
                                case '$is':
                                    delete object[k];
                                    return [object[Op.is] = v];
                                case '$in':
                                    delete object[k];
                                    return [object[Op.in] = v];
                                case '$notIn':
                                    delete object[k];
                                    return [object[Op.notIn] = v];
                                case '$like':
                                    delete object[k];
                                    return [object[Op.like] = v];
                                case '$notLike':
                                    delete object[k];
                                    return [object[Op.notLike] = v];
                                case '$viLike':
                                    delete object[k];
                                    return [object[Op.viLike] = v];
                                case '$notILike':
                                    delete object[k];
                                    return [object[Op.notILike] = v];
                                case '$startsWith':
                                    delete object[k];
                                    return [object[Op.startsWith] = v];
                                case '$endsWith':
                                    delete object[k];
                                    return [object[Op.endsWith] = v];
                                case '$substring':
                                    delete object[k];
                                    return [object[Op.substring] = v];
                                case '$regexp':
                                    delete object[k];
                                    return [object[Op.regexp] = v];
                                case '$notRegexp':
                                    delete object[k];
                                    return [object[Op.notRegexp] = v];
                                case '$iRegexp':
                                    delete object[k];
                                    return [object[Op.iRegexp] = v];
                                case '$notIRegexp':
                                    delete object[k];
                                    return [object[Op.notIRegexp] = v];
                                case '$between':
                                    delete object[k];
                                    return [object[Op.between] = v];
                                case '$notBetween':
                                    delete object[k];
                                    return [object[Op.notBetween] = v];
                                case '$overlap':
                                    delete object[k];
                                    return [object[Op.overlap] = v];
                                case '$contains':
                                    delete object[k];
                                    return [object[Op.contains] = v];
                                case '$contained':
                                    delete object[k];
                                    return [object[Op.contained] = v];
                                case '$adjacent':
                                    delete object[k];
                                    return [object[Op.adjacent] = v];
                                case '$strictLeft':
                                    delete object[k];
                                    return [object[Op.strictLeft] = v];
                                case '$strictRight':
                                    delete object[k];
                                    return [object[Op.strictRight] = v];
                                case '$noExtendRight':
                                    delete object[k];
                                    return [object[Op.noExtendRight] = v];
                                case '$noExtendLeft':
                                    delete object[k];
                                    return [object[Op.noExtendLeft] = v];
                                case '$and':
                                    delete object[k];
                                    return [object[Op.and] = v];
                                case '$or ':
                                    delete object[k];
                                    return [object[Op.or] = v];
                                case '$any':
                                    delete object[k];
                                    return [object[Op.any] = v];
                                case '$all':
                                    delete object[k];
                                    return [object[Op.all] = v];
                                case '$values':
                                    delete object[k];
                                    return [object[Op.values] = v];
                                case '$col':
                                    delete object[k];
                                    return [object[Op.col] = v];
                                case '$placeholder':
                                    delete object[k];
                                    return [object[Op.placeholder] = v];
                                case '$join':
                                    delete object[k];
                                    return [object[Op.join] = v];
                            }
                        } else {
                            return [module.exports.replaceOperators(v)];
                        }
                    })
                )
                : object;
    },

    replaceIncludeToObject(obj, Models) {
        if (typeof (obj) === 'object') {
            for (const [key, value] of Object.entries(obj)) {
                if (key == 'model') {
                    // handle scopes from text
                    obj.model = Models[value];
                    if (_.has(obj, 'scope')) {
                        if (obj.scope === false) {
                            obj.model = obj.model.unscoped()
                        } else {
                            obj.model = obj.mode.scope(obj.scope)
                        }
                    }
                }
                else {
                    if (typeof (value) === 'object')
                        module.exports.replaceIncludeToObject(value, Models);
                }
            }
        } else if (Array.isArray(obj)) {
            for (let index = 0; index < obj.length; index++) {
                const element = obj[index];
                module.exports.replaceIncludeToObject(element, Models);
            }
        }
    },

    senitizeModelOptions(options, model, Models) {
        if (_.has(options, 'attributes') && !options.attributes.includes(model.autoIncrementAttribute)) {
            options.attributes.push(model.autoIncrementAttribute);
        }
        module.exports.replaceIncludeToObject(options, Models);
        options = module.exports.replaceOperators(options)
        return options;
    },



    getHeadersAndDeRef: function (model, req) {
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
            const assosIndex = associations.findIndex(o => o.foreignKey == fields_info[fld].fieldName);
            if (req.body.read && req.body.read.autoderef && assosIndex > -1) {
                // ASSOCIATION found, belongsTo field
                field_headers.push({
                    text: associations[assosIndex].name.singular,
                    value: associations[assosIndex].name.singular + '.name', //TODO get titlefield from model
                    sortable: fields_info[fld].sortable ? fields_info[fld].sortable : true,
                })
                // TODO add in model include if not set
                if (!req.body.read.modeloptions.include) req.body.read.modeloptions.include = [];
                inArrayAsString = req.body.read.modeloptions.include.includes(associations[assosIndex].name.singular);
                inArrayAsObjectInclude = req.body.read.modeloptions.include.findIndex(o => o.model == associations[assosIndex].name.singular);
                if (!inArrayAsString && inArrayAsObjectInclude == -1) {
                    req.body.read.modeloptions.include.push(associations[assosIndex].name.singular);
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

    injectAddAction: function (model, req) {
        var addFields = undefined;
        if (req.body.create && req.body.create.modeloptions && req.body.create.modeloptions.attributes) addFields = req.body.create.modeloptions.attributes;
        var addAction = {
            name: 'vnatk_add',
            caption: 'Add',
            type: 'NoRecord',

            formschema: VNATKClientHelpers.generateFormSchemaFromModel(model, addFields)
        }
        return [addAction];
    },

    injectEditAction: function (model, req) {
        var editFields = undefined;
        if (req.body.update && req.body.update.modeloptions && req.body.update.modeloptions.attributes) editFields = req.body.update.modeloptions.attributes;
        var editAction = {
            name: 'vnatk_edit',
            caption: 'Edit',
            type: 'single',
            placeIn: 'buttonGroup',
            formschema: VNATKClientHelpers.generateFormSchemaFromModel(model, editFields)
        }
        return [editAction];
    },

    injectDeleteAction: function (model, req) {
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