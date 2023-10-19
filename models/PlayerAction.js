const getPlayerActionModel = (sequelize, { DataTypes }) => {
  const PlayerAction = sequelize.define("playerAction", {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    // Define attributes for player actions (type, amount, etc.)
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
  });

  // Define associations with other models, e.g., User, PokerGame
  PlayerAction.associate = (models) => {
    PlayerAction.belongsTo(models.User, { foreignKey: "userId" });
    PlayerAction.belongsTo(models.PokerGame, { foreignKey: "gameId" });
  };

  return PlayerAction;
};

module.exports = { getPlayerActionModel };
