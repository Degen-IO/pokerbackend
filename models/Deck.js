const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/connection");

class Deck extends Model {
  shuffle() {
    const shuffledCards = [...this.cards];

    for (let i = shuffledCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCards[i], shuffledCards[j]] = [
        shuffledCards[j],
        shuffledCards[i],
      ];
    }

    // Update the deck with the shuffled cards
    this.cards = shuffledCards;
    return this.save();
  }
}

Deck.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
  },
  {
    sequelize,
    timestamps: false,
    modelName: "deck",
  }
);

// Define a many-to-many association with the Card model
Deck.belongsToMany(Card, {
  through: "DeckCard", // This will be the join table name
  foreignKey: "deck_id",
});

module.exports = Deck;
