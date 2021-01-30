const VNATKClientHelpers = require("../helperFunctions/clientside");
const VNATKModelDesignerHelpers = require("../helperFunctions/modeldesigner");
const _ = require('lodash');

module.exports = {

    init: async function (req, res, next, Models) {
        var models = {};

        Object.keys(Models).forEach(modelName => {
            if (modelName === 'sequelize' || modelName === 'Sequelize') return;

            // Object.keys(Models[modelName]).forEach(prop => {
            //     console.log(prop, Models[modelName][prop]);
            // });
            var fields = {};
            Object.keys(Models[modelName].rawAttributes).forEach(field => {
                fields[field] = Models[modelName].rawAttributes[field];
                fields[field]['type']['key'] = Models[modelName].rawAttributes[field].type.key;
            });

            models[modelName] = { name: modelName, tableName: Models[modelName].tableName, rawAttributes: fields, associations: VNATKClientHelpers.getAssociations(Models[modelName]), scopes: VNATKClientHelpers.getScopes(Models[modelName]) };
            if (Models[modelName].vnAtkGetActions) {
                models[modelName]['actions'] = Models[modelName].vnAtkGetActions();
                for (let index = 0; index < models[modelName]['actions'].length; index++) {
                    const action = models[modelName]['actions'][index];
                    if (_.has(Models[modelName].prototype, action.execute)) action.code = Models[modelName].prototype[action.execute].toString();

                }
            }
        })
        const data = { models, sequlize: {} };
        res.send(data);
    },

    save: async function (req, res, next, Models) {
        const fs = require('fs').promises;

        const path = require('path');
        var appDir = path.dirname(require.main.filename);
        const modelsPath = path.join(appDir, '../models/modeldesigner');

        const fileTemplate = VNATKModelDesignerHelpers.getModelTemplate();
        for (const [modelName, modelData] of Object.entries(req.body.modelsData)) {
            var file = fileTemplate;
            file = file.replace(/ClassName/gi, modelName);

            // WRITE ASSOCIATIONS
            var associations = [];
            for (let index = 0; index < modelData.belongsToCrud.response.data.length; index++) {
                const assos = modelData.belongsToCrud.response.data[index];
                associations.push("\t\t" + modelName + '.belongsTo(models.' + assos.model + ', {foreignKey: "' + assos.foreignField + '"});');
            }
            for (let index = 0; index < modelData.HasManyCrud.response.data.length; index++) {
                const assos = modelData.HasManyCrud.response.data[index];
                associations.push("\t\t" + modelName + '.hasMany(models.' + assos.model + ', {foreignKey: "' + assos.foreignField + '"});');
            }
            for (let index = 0; index < modelData.BelongsToManyCrud.response.data.length; index++) {
                const assos = modelData.BelongsToManyCrud.response.data[index];
                associations.push("\t\t" + modelName + '.belongsToMany(models.' + assos.model + ', {through: models.' + assos.through + ', foreignKey: "' + assos.foreignField + '"});');
            }
            var associationsStr = associations.join("\n");
            file = file.replace(/ASSOCIATIONS/gi, associationsStr);

            // WRITE ACTIONS
            var VNATKACTIONFUNCTION = [];
            var ACTIONSCODE = [];

            for (let index = 0; index < modelData.actionsCrud.response.data.length; index++) {
                const action = modelData.actionsCrud.response.data[index];
                ACTIONSCODE.push(action.code);
                VNATKACTIONFUNCTION.push(_.pick(action, "name", 'type', 'where', 'execute', 'formschema'));
            }
            file = file.replace(/VNATKACTIONFUNCTION/gi, JSON.stringify(VNATKACTIONFUNCTION));
            file = file.replace(/ACTIONSCODE/gi, ACTIONSCODE.join("\n\n"));

            // WRITE FIELDS
            var fields_str_array = [];

            for (let index = 0; index < modelData.fieldsCrud.response.data.length; index++) {
                const field = modelData.fieldsCrud.response.data[index];
                var fields_str = "";
                fields_str += field.fieldName + ': {'
                fields_str += 'type: DataTypes.' + field.type + ',';
                if (field.dbField)
                    fields_str += 'field: "' + field.dbField + '",'
                if (field.defaultValue)
                    fields_str += 'defaultValue: "' + field.defaultValue + '",'
                if (field.caption)
                    fields_str += 'caption: "' + field.caption + '",'
                if (field.validate)
                    fields_str += 'validate: ' + field.validate + ','
                fields_str += '},'
                fields_str_array.push(fields_str);
            }


            file = file.replace(/FIELDS/gi, "\t{" + fields_str_array.join("\n") + '}');

            // WRITE SCOPES
            var scopes_array = [];

            for (let index = 0; index < modelData.scopesCrud.response.data.length; index++) {
                const scope = modelData.scopesCrud.response.data[index];
                if (scope.scope == 'defaultScope' && scope.code && scope.code.length > 0) {
                    var ds = "defaultScope: ";
                    file = file.replace(/_defaultScope_/gi, "\t" + ds + scope.code + ',');
                } else if (scope.code) {
                    scopes_array.push(scope.scope + ':' + scope.code);
                }
            }
            file = file.replace(/_defaultScope_/gi, "");

            file = file.replace(/scopes/gi, "\tscopes:{" + scopes_array.join(",\n") + "}");
            if (modelData.tableName)
                file = file.replace(/tableName/gi, "tableName: '" + modelData.tableName + "',");
            else
                file = file.replace(/tableName/gi, "");

            await fs.writeFile(path.join(modelsPath, modelName + '.js'), file);
            // console.log(file);
        }


    }
}