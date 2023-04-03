const { Schema, model } = require("mongoose");
/*


*/
const PlayerSchema = new Schema({
  name: { type: String, required: true },
  chips: { type: Number, required: true },
  isDealer: { type: Boolean, required: true, default: false },
  isSmallBlind: { type: Boolean, required: true, default: false },
  isBigBlind: { type: Boolean, required: true, default: false },
  hand: [{ type: String }],
  isActive: { type: Boolean, required: true, default: true },
  isAllIn: { type: Boolean, required: true, default: false },
  lastBet: { type: Number, required: true, default: 0 },
  betAmount: { type: Number, required: true, default: 0 },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    unique: true, //ensure each user only has one player
  },
});

const Player = model("Player", PlayerSchema);

module.exports = Player;
