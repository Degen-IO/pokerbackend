const getDeckModel = (sequelize, { DataTypes }) => {
  const Deck = sequelize.define("deck", {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
  });

  // Define the one-to-many relationship between Deck and Card
  Deck.associate = (models) => {
    Deck.hasMany(models.Card, { as: "cards" });
  };

  // Add a shuffle method to the Deck model
  Deck.prototype.shuffle = async function () {
    const cards = await this.getCards(); // Assuming you have a getter method like this

    if (cards.length < 2) {
      return this; // No need to shuffle if there are 0 or 1 cards
    }

    const shuffledCards = [...cards];

    for (let i = shuffledCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCards[i], shuffledCards[j]] = [
        shuffledCards[j],
        shuffledCards[i],
      ];
    }

    // Update the deck with the shuffled cards
    await this.setCards(shuffledCards); // Assuming you have a setter method like this
    return this;
  };

  return Deck;
};

module.exports = { getDeckModel };
