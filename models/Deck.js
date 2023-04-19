const { Schema, model } = require("mongoose");
const Card = require("./index");
/*


*/
const deckSchema = new Schema({
  cards: [
    {
      type: Schema.Types.ObjectId,
      ref: "Card",
      required: true,
    },
  ],
});

// Define the shuffle method on the Deck schema
deckSchema.methods.shuffle = function () {
  const shuffledCards = [...this.cards];

  for (let i = shuffledCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledCards[i], shuffledCards[j]] = [shuffledCards[j], shuffledCards[i]];
  }

  // Update the deck with the shuffled cards
  this.cards = shuffledCards;
  return this.save();
};

const Deck = model("Deck", deckSchema);

module.exports = Deck;
