const VNATKClientHelpers = require("../helperFunctions/clientside");


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

            models[modelName] = { name: modelName, tableName: Models[modelName].tableName, rawAttributes: fields, associations: VNATKClientHelpers.getAssociations(Models[modelName]) };

        })
        const data = { models, sequlize: {} };
        res.send(data);
    },

    save: function (req, res, next, Models) {

    }
}