// deck.js
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

  // Add a method to get a shuffled deck
  // Add a method to get a shuffled deck
  Card.getShuffledDeck = async () => {
    try {
      const cards = await Card.findAll(); // Get all cards from the database
      if (!cards || cards.length === 0) {
        throw new Error("No cards found in the database.");
      }

      // Shuffle the cards using the provided logic
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }

      // console.log("Shuffled deck:", cards); // Log the shuffled deck for debugging
      return cards;
    } catch (error) {
      console.error("Error getting shuffled deck:", error);
      throw error;
    }
  };

  return Card;
};

module.exports = { getCardModel };
