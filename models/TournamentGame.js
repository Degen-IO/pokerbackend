const getTournamentGameModel = (sequelize, { DataTypes }) => {
  const TournamentGame = sequelize.define("tournamentGame", {
    tournamentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    gameType: {
      type: DataTypes.ENUM("tournament"),
      allowNull: false,
      defaultValue: "tournament",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    status: {
      type: DataTypes.ENUM("waiting", "ongoing", "finished"),
      allowNull: false,
    },

    startDateTime: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isFuture: function (value) {
          if (new Date(value) <= new Date()) {
            throw new Error(
              "Start date and time must be at least 5min in the future."
            );
          }
        },
      },
    },

    playersPerTable: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 2,
        max: 10,
      },
    },
    // Tournament game-specific attributes
    numberOfRebuys: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 0,
        max: 3,
      },
    },
    rebuyPeriod: {
      type: DataTypes.ENUM("_30min", "_60min", "_90min", "_120min", "none"),
      allowNull: false,
    },
    addOn: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    startingChips: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    gameSpeed: {
      type: DataTypes.ENUM("slow", "medium", "fast", "ridiculous"),
      allowNull: false,
    },
    lateRegistrationDuration: {
      type: DataTypes.ENUM("_30min", "_60min", "_90min", "none"),
      allowNull: false,
    },
  });

  TournamentGame.associate = (models) => {
    TournamentGame.belongsTo(models.User, { foreignKey: "userId" });

    TournamentGame.belongsTo(models.PokerGroup, { foreignKey: "groupId" });

    TournamentGame.hasMany(models.PlayerHand, { foreignKey: "tournamentId" });

    TournamentGame.hasMany(models.PlayerAction, { foreignKey: "tournamentId" });

    TournamentGame.hasMany(models.BlindLevel, { foreignKey: "tournamentId" });

    TournamentGame.hasMany(models.Table, { foreignKey: "tournamentId" });
  };

  return TournamentGame;
};

module.exports = { getTournamentGameModel };
