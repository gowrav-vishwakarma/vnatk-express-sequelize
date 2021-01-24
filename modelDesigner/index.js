const VNATKClientHelpers = require("../helperFunctions/clientside");


module.exports = {

    init: async function (req, res, next, Models) {
        var models = {};
        Object.keys(Models).forEach(modelName => {
            if (modelName === 'sequelize' || modelName === 'Sequelize') return;
            models[modelName] = { rawAttributes: Models[modelName].rawAttributes, associations: VNATKClientHelpers.getAssociations(Models[modelName]) };

        })
        res.send(models);
    },

    save: function (req, res, next, Models) {

    }
}