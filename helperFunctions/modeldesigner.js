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
        _defaultScope_
        scopes,
        tableName
        sequelize,
        modelName: 'ClassName',
    }
);

return ClassName;
};
        `
    }
}