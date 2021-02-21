module.exports = (sequelize, DataTypes) => {
    const Project = sequelize.define('Project', {
        title: DataTypes.STRING,
        imageUrl: DataTypes.STRING,
        description: DataTypes.TEXT,
        adminId: DataTypes.INTEGER
    }, {});
    Project.associate = function (models) {
        Project.belongsTo(models.User, {
            foreignKey: 'adminId',
            onDelete: 'CASCADE',
            as: 'ProjectAdmin'
        })
        Project.belongsToMany(models.User, {
            foreignKey: 'adminId',
            onDelete: 'CASCADE',
            as: 'ProjectUsers',
            through: models.UserProjects
        })
    };
    return Project;
};