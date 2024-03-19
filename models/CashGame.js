const getCashGameModel = (sequelize, { DataTypes }) => {
  const CashGame = sequelize.define("cashGame", {
    cashId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    gameType: {
      type: DataTypes.ENUM("cash"),
      allowNull: false,
      defaultValue: "cash",
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
    // Cash game-specific attributes
    startingChips: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    blindsSmall: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    blindsBig: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    //we can write a function to map the choice to a corresponding number so that it can be used against the startTime/startDate
    duration: {
      type: DataTypes.ENUM(
        "_1hr",
        "_2hr",
        "_3hr",
        "_4hr",
        "unlimited",
        "manual"
      ),
      allowNull: false,
    },
  });

  CashGame.associate = (models) => {
    CashGame.belongsTo(models.User, { foreignKey: "userId" });

    CashGame.belongsTo(models.PokerGroup, { foreignKey: "groupId" });

    CashGame.hasMany(models.PlayerHand, { foreignKey: "cashId" });

    CashGame.hasMany(models.PlayerAction, { foreignKey: "cashId" });

    CashGame.hasMany(models.Table, { foreignKey: "cashId" });
  };

  return CashGame;
};

module.exports = { getCashGameModel };
