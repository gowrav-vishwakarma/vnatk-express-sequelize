module.exports = (sequelize, DataTypes) => {
    const UserProjectRemarks = sequelize.define('UserProjectRemarks', {
        remarks: DataTypes.STRING,
    }, {});
    UserProjectRemarks.associate = function (models) {
        UserProjectRemarks.belongsTo(models.UserProjects, {
            foreignKey: 'userProjectId',
            as: 'ProjectRemarks'
        })
    };
    return UserProjectRemarks;
};