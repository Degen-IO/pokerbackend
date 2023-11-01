const getPokerGroupModel = (sequelize, { DataTypes }) => {
  const PokerGroup = sequelize.define("pokerGroup", {
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    joinPassword: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  PokerGroup.associate = (models) => {
    // A poker group can have multiple user roles, and each user role is associated with a specific poker group.
    PokerGroup.hasMany(models.UserGroupRole, { foreignKey: "groupId" });

    // A poker group can have multiple cash games, define an association for cash games within the group.
    PokerGroup.hasMany(models.CashGame, { foreignKey: "groupId" });

    // A poker group can have multiple tournament games, define an association for tournament games within the group.
    PokerGroup.hasMany(models.TournamentGame, { foreignKey: "groupId" });
  };

  return PokerGroup;
};

module.exports = { getPokerGroupModel };
