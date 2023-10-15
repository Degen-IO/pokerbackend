const getCardModel = (sequelize, { DataTypes }) => {
  const Card = sequelize.define("card", {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    rank: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [
          [
            "TWO",
            "THREE",
            "FOUR",
            "FIVE",
            "SIX",
            "SEVEN",
            "EIGHT",
            "NINE",
            "TEN",
            "JACK",
            "QUEEN",
            "KING",
            "ACE",
          ],
        ],
      },
    },
    suit: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["CLUBS", "DIAMONDS", "HEARTS", "SPADES"]],
      },
    },
  });

  Card.associate = (models) => {
    Card.belongsTo(models.Deck);
  };

  return Card;
};

module.exports = { getCardModel };
