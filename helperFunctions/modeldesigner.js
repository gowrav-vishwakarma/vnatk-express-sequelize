module.exports = {
    getModelTemplate() {
        return `'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
class ClassName extends Model {
    static associate(models) {
ASSOCIATIONS
    }

    static vnAtkGetActions(models) {
        return VNATKACTIONFUNCTION
    }

ACTIONSCODE

}

ClassName.init(
FIELDS,
    {
        defaultScope,
        scopes,
        tableName: '_tableName_',
        sequelize,
        modelName: 'ClassName',
    }
);

return ClassName;
};
        `
    }
}