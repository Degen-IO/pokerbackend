const db = require("../config/connection");
const { User, Player } = require("../models");
const UserSeeds = require("./profileSeeds.json");
const PlayerSeeds = require("./playerSeeds.json");

db.once("open", async () => {
  try {
    await User.deleteMany({});
    await Player.deleteMany({});
    await User.create(UserSeeds);
    await Player.create(PlayerSeeds);

    console.log("Seeded!");
    process.exit(0);
  } catch (err) {
    throw err;
  }
});
