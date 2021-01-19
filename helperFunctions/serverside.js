const VNATKClientHelpers = require("../helperFunctions/clientside");
const _ = require('lodash');

module.exports = {

    replaceIncludeToObject(obj, Models) {
        if (typeof (obj) === 'object') {
            for (const [key, value] of Object.entries(obj)) {
                if (key == 'model') {
                    // console.log(typeof models[value]);
                    obj.model = Models[value];
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
        if (_.has(options, 'attributes') && !options.attributes.includes(model.primaryKeyAttributes[0])) {
            options.attributes.push(model.primaryKeyAttributes[0]);
        }
        module.exports.replaceIncludeToObject(options, Models);
        return options;
    },

    setupOrderByGroupBy: function (modeloptions, datatableoptions) {
        // sortBy: ["City.name", "State.name"], sortDesc: [false, false]
        var returnValue = { order: false, group: false };
        if (datatableoptions.sortBy.length) { // ["City.name", "State.name"]
            returnValue.order = [];
            for (let i = 0; i < datatableoptions.sortBy.length; i++) {
                var sortArray = [];
                const sortBY = datatableoptions.sortBy[i]; // "City.name", "State.name"
                var t_sortBy = sortBY.split(".").reverse(); // ['name','City']
                var fieldDone = false;
                for (let j = 0; j < t_sortBy.length; j++) {
                    const stringPart = t_sortBy[j]; // "name", "City"
                    if (!fieldDone) {
                        if (datatableoptions.sortDesc[i]) sortArray.push("DESC"); // Equivalent sortDesc
                        sortArray.push(stringPart); // name done... rest should be model relations path only
                        fieldDone = true;
                    } else {
                        sortArray.push({ model: stringPart }) // {model: 'City'}
                    }
                }
                returnValue.order.push(sortArray.reverse());
            }
        }

        return returnValue;
        // return modeloptions;
    },

    getHeaders: function (model, req) {
        var fields = undefined;
        if (req.body.tableoptions && req.body.tableoptions.modeloptions && req.body.tableoptions.modeloptions.attributes) fields = req.body.tableoptions.modeloptions.attributes;

        var fields_info = model.rawAttributes;
        if (!fields || fields == undefined || fields == null || fields == '' || fields == '*' || fields.length == 0) {
            fields = _.keys(fields_info);
        }

        var field_headers = [];

        for (let i = 0; i < fields.length; i++) {
            const fld = fields[i];
            field_headers.push({
                text: fields_info[fld].caption ? fields_info[fld].caption : fields_info[fld].fieldName,
                value: fields_info[fld].fieldName,
                sortable: fields_info[fld].sortable ? fields_info[fld].sortable : true
            })
        }
        return field_headers;
    },

    createNew: async function (model, data, readModelOptions) {
        const item = await model['create'](data);
        var m_loaded = await model.findByPk(item[model.primaryKeyAttributes[0]], readModelOptions);
        return m_loaded;
    },

    editRecord: async function (model, item, readModelOptions) {
        id = item[model.primaryKeyAttributes[0]];
        delete item[model.primaryKeyAttributes[0]];
        var where_condition = {};
        where_condition[model.primaryKeyAttributes[0]] = id;
        const updated = await model.update(item, { where: where_condition });
        var m_loaded = await model.findByPk(id, readModelOptions);
        return m_loaded;
    },

    injectAddAction: function (model, req) {
        var addFields = undefined;
        if (req.body.addoptions && req.body.addoptions.modeloptions && req.body.addoptions.modeloptions.attributes) addFields = req.body.addoptions.modeloptions.attributes;
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
        if (req.body.editoptions && req.body.editoptions.modeloptions && req.body.editoptions.modeloptions.attributes) editFields = req.body.editoptions.modeloptions.attributes;
        var editAction = {
            name: 'vnatk_edit',
            caption: 'Edit',
            type: 'single',
            formschema: VNATKClientHelpers.generateFormSchemaFromModel(model, editFields)
        }
        return [editAction];
    },

    injectDeleteAction: function (model, req) {
        var deleteAction = {
            name: 'vnatk_delete',
            caption: 'Delete',
            type: 'single',
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
    }

}