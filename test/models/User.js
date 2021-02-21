module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        email: DataTypes.STRING,
        password: DataTypes.STRING
    }, {});
    User.associate = function (models) {
        // associations can be defined here
        User.belongsTo(models.Group, {
            foreignKey: 'groupId',
            as: 'Group'
        })
        User.hasMany(models.Project, {
            foreignKey: 'adminId',
            as: 'ProjectsOwned'
        })
        User.belongsToMany(models.Project, {
            foreignKey: 'adminId',
            as: 'Projects',
            through: models.UserProjects
        })
    };
    return User;
};