const { sequelize, User, Player, Card } = require("../models");
const fs = require("fs");
const path = require("path");

const seedData = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "userSeeds.json"), "utf8")
);

const cardSeedData = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "cardSeeds.json"), "utf8")
);

const seedDatabase = async () => {
  try {
    await sequelize.sync({ force: true });

    for (const userData of seedData) {
      const user = await User.create(userData.User);
      await Player.create({
        ...userData.Player,
        user_id: user.id, // Associate the player with the created user
      });
    }

    for (const cardData of cardSeedData) {
      await Card.create(cardData);
    }

    console.log("Database seeded successfully.");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding the database:", error);
    process.exit(1);
  }
};

seedDatabase();
