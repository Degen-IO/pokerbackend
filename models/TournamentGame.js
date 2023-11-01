const { validateStartTime } = require("../utils/validateStartTime");

const getTournamentGameModel = (sequelize, { DataTypes }) => {
  const TournamentGame = sequelize.define("tournamentGame", {
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
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
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
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

    TournamentGame.hasMany(models.PlayerHand, { foreignKey: "gameId" });

    TournamentGame.hasMany(models.PlayerAction, { foreignKey: "gameId" });

    TournamentGame.hasMany(models.BlindLevel, { foreignKey: "gameId" });
  };

  //validate time before game creation
  TournamentGame.addHook("beforeValidate", "checkStartTime", validateStartTime);

  return TournamentGame;
};

module.exports = { getTournamentGameModel };
