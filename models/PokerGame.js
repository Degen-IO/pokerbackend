const getPokerGameModel = (sequelize, { DataTypes }) => {
  const PokerGame = sequelize.define("pokerGame", {
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
    //  You can add more attributes specific to your poker game model here
    // For example, you might want to track the current round, bets, pot, etc.
  });

  // Define associations with other models, e.g., User, PokerGroup, Deck, etc.
  PokerGame.associate = (models) => {
    PokerGame.belongsTo(models.User, { foreignKey: "userId" });
    PokerGame.belongsTo(models.PokerGroup, { foreignKey: "groupId" });
    // Add other associations as needed
  };

  return PokerGame; // Export the PokerGame model
};

module.exports = { getPokerGameModel };
