const { Schema, model } = require("mongoose");
/*


*/
const cardSchema = new Schema({
  rank: {
    type: String,
    enum: [
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
    required: true,
  },
  suit: {
    type: String,
    enum: ["CLUBS", "DIAMONDS", "HEARTS", "SPADES"],
    required: true,
  },
});

const Card = model("Card", cardSchema);

module.exports = Card;
