module.exports = (sequelize, DataTypes) => {
    const Skill = sequelize.define('Skill', {
        name: DataTypes.STRING,
    }, {});
    Skill.associate = function (models) {
        // associations can be defined here
        Skill.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'SkillOwner'
        })
    };
    return Skill;
};