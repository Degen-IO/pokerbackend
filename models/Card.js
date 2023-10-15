const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/connection");

class Card extends Model {}

Card.init(
  {
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
  },
  {
    sequelize,
    timestamps: false,
    freezeTableName: true,
    underscored: true,
    modelName: "card",
  }
);

module.exports = Card;
