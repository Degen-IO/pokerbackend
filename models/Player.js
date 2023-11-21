const getPlayerModel = (sequelize, { DataTypes }) => {
  const Player = sequelize.define("player", {
    playerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Add a field to store the game type (e.g., "cash" or "tournament")
    gameType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  Player.associate = (models) => {
    // Player belongs to a User
    Player.belongsTo(models.User, { foreignKey: "userId" });

    // Player can be associated with either a CashGame or a TournamentGame
    // Define the associations for CashGame and TournamentGame here
    Player.belongsTo(models.CashGame, { foreignKey: "gameId" });
    Player.belongsTo(models.TournamentGame, { foreignKey: "gameId" });
  };

  return Player;
};

module.exports = { getPlayerModel };