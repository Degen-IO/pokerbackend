const getPlayerModel = (sequelize, { DataTypes }) => {
  const Player = sequelize.define("player", {
    playerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    cashId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    tournamentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Add a field to store the game type (e.g., "cash" or "tournament")
    gameType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    seatNumber: {
      type: DataTypes.INTEGER,
      allowNull: true, // Initially null until the player is seated
    },
  });

  Player.associate = (models) => {
    // Player belongs to a User
    Player.belongsTo(models.User, { foreignKey: "userId" });
    Player.belongsTo(models.Table, { foreignKey: "tableId" });

    // Player can be associated with either a CashGame or a TournamentGame
    Player.belongsTo(models.CashGame, { foreignKey: "cashId" });
    Player.belongsTo(models.TournamentGame, { foreignKey: "tournamentId" });
  };

  return Player;
};

module.exports = { getPlayerModel };
