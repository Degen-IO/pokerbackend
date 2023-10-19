const getPlayerHandModel = (sequelize, { DataTypes }) => {
  const PlayerHand = sequelize.define("playerHand", {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    // Define attributes for player hand, if necessary
  });

  // Define associations with other models, e.g., User, PokerGame
  PlayerHand.associate = (models) => {
    PlayerHand.belongsTo(models.User, { foreignKey: "userId" });
    PlayerHand.belongsTo(models.PokerGame, { foreignKey: "gameId" });
  };

  return PlayerHand;
};

module.exports = { getPlayerHandModel };
