const _ = require('lodash');
const VNATKServerHelpers = require('./serverside');


module.exports = {
    generateFormSchemaFromModel: function (model, fields) {
        const ModelAssociations = module.exports.getAssociations(model);

        const rawAttributes = model.rawAttributes;
        if (fields == undefined) {
            fields = _.keys(rawAttributes);
        }
        var schema = {};
        for (let i = 0; i < fields.length; i++) {
            const element = fields[i];
            const modelField = _.find(rawAttributes, (x) => x.fieldName == element);
            schema[element] = Object.assign({
                label: modelField.caption ? modelField.caption : modelField.fieldName
            },
                module.exports.sequliseToFormSchemaType(modelField, ModelAssociations)
            );
            if (modelField.primaryKey) schema[element].primaryKey = true;
            if (modelField.isSystem) schema[element].isSystem = true;
        }
        return schema;
    },

    sequliseToFormSchemaType: function (field, ModelAssociations) {
        var t = { type: 'text' };
        switch (field.type.constructor.name) {
            case 'STRING':
                if (field.ext) {
                    t['ext'] = field.ext
                }
                break;
            case 'ENUM':
                t['type'] = 'select';
                t['items'] = field.type.values;
                t['autocomplete'] = "disabled";
                break
            case 'INTEGER':
                t['type'] = 'number'
                if (_.has(field, 'references')) {
                    t.references = field.references;
                    t.association = ModelAssociations[_.findIndex(ModelAssociations, (as) => { return as.foreignKey == field.fieldName })];
                    t.type = 'autocomplete';
                    t.searchInput = "";
                    t['no-filter'] = true;
                }
                break;
            default:
                t = { type: 'text' };
                break;
        }
        if (field.validate) t.validate = field.validate;
        if (field.defaultValue) t.defaultValue = field.defaultValue;
        return t;
    },

    getAssociations(model) {
        var t = [];
        Object.keys(model.associations).forEach((key) => {
            if (model.associations[key].hasOwnProperty('options')) {
                delete model.associations[key].options.sequelize;
                t.push(_.pick(model.associations[key].options, ['foreignKey', 'as', 'validate', 'indexes', 'name', 'onDelete', 'onUpdate']));
            }
        });
        return t;
    }
}