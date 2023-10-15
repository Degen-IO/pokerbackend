const getPlayerModel = (sequelize, { DataTypes }) => {
  const Player = sequelize.define("player", {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    chips: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isDealer: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isSmallBlind: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isBigBlind: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    hand: {
      type: DataTypes.ARRAY(DataTypes.STRING),
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isAllIn: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lastBet: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    betAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    user_id: {
      type: DataTypes.INTEGER,
      unique: true,
      references: {
        model: "users",
        key: "id",
      },
    },
  });

  Player.associate = (models) => {
    Player.belongsTo(models.User);
  };

  return Player;
};

module.exports = { getPlayerModel };
