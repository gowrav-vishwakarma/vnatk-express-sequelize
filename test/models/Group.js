module.exports = (sequelize, DataTypes) => {
    const Group = sequelize.define('Group', {
        name: DataTypes.STRING,
    }, {});
    Group.associate = function (models) {
        // associations can be defined here
        Group.hasMany(models.User, {
            foreignKey: 'groupId',
            as: 'GroupUsers'
        })
    };
    return Group;
};