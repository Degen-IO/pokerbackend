const getBlindLevelModel = (sequelize, { DataTypes }) => {
  const BlindLevel = sequelize.define("blindLevel", {
    levelNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1, // Minimum level number
      },
    },
    smallBlind: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1, // Minimum small blind value
      },
    },
    bigBlind: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 2, // Minimum big blind value (usually double the small blind)
      },
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1, // Minimum duration in minutes
      },
    },
    startingChips: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1, // Minimum starting chips
      },
    },
  });

  BlindLevel.associate = (models) => {
    // Associate with TournamentGame
    BlindLevel.belongsTo(models.TournamentGame, { foreignKey: "gameId" });
  };

  return BlindLevel;
};

module.exports = { getBlindLevelModel };
