const db = require("../config/connection");
const { User, Player, Deck, Card } = require("../models");
const UserSeeds = require("./profileSeeds.json");
const PlayerSeeds = require("./playerSeeds.json");
const CardSeeds = require("./cardSeeds.json");

db.once("open", async () => {
  try {
    await User.deleteMany({});
    await Player.deleteMany({});
    await Card.deleteMany({});
    await User.create(UserSeeds);
    await Player.create(PlayerSeeds);
    await Card.create(CardSeeds);
    const deck = new Deck();
    deck.cards = await Card.find();
    console.log(
      "Original deck ==============================================="
    );
    console.log(deck.cards);
    deck.shuffle();
    console.log("shuffle deck==========================");
    console.log(deck.cards);
    console.log("Seeded!");
    process.exit(0);
  } catch (err) {
    throw err;
  }
});
