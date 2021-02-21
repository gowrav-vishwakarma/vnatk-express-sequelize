module.exports = (sequelize, DataTypes) => {
    const UserProjects = sequelize.define('UserProjects', {
        assignedOn: DataTypes.DATE,
        remarks: DataTypes.STRING,
        isDone: DataTypes.BOOLEAN,
    }, {});
    UserProjects.associate = function (models) {
        UserProjects.belongsTo(models.Project, {
            foreignKey: 'projectId'
        });

        UserProjects.belongsTo(models.User, {
            foreignKey: 'userId'
        });

        UserProjects.hasMany(models.UserProjectRemarks, {
            foreignKey: 'userProjectId'
        });

    };
    return UserProjects;
};