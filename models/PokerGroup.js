const getPokerGroupModel = (sequelize, { DataTypes }) => {
  const PokerGroup = sequelize.define("pokerGroup", {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  PokerGroup.associate = (models) => {
    //A poker group can have multiple user roles, and each user role is associated with a specific poker group.
    PokerGroup.hasMany(models.UserGroupRole, { foreignKey: "groupId" });

    //a poker group can have multiple poker games, define an association for poker games within the group.
    PokerGroup.hasMany(models.PokerGame, { foreignKey: "groupId" });
  };

  return PokerGroup;
};

module.exports = { getPokerGroupModel };
