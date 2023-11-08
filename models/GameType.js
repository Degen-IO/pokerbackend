const getGameTypeModel = (sequelize, { DataTypes }) => {
  const GameType = sequelize.define("gameType", {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.ENUM("cash", "tournament"), // Define valid game type values
      allowNull: false,
    },
  });

  GameType.associate = (models) => {
    GameType.belongsTo(models.User, { foreignKey: "userId" });

    GameType.belongsTo(models.CashGame, {
      foreignKey: "gameTypeId",
      as: "cashGame",
    });

    GameType.belongsTo(models.TournamentGame, {
      foreignKey: "gameTypeId",
      as: "tournamentGame",
    });
  };
};

module.exports = { getGameTypeModel };
