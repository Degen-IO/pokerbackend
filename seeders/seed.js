const sequelize = require("../config/connection");
const { User, UserGroupRole, PokerGroup, Deck } = require("../models");
const fs = require("fs");
const path = require("path");

const userSeedData = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "userSeeds.json"), "utf8")
);

const groupSeedData = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "groupSeeds.json"), "utf8")
);

const cardSeedData = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "cardSeeds.json"), "utf8")
);

const seedDatabase = async (sequelize) => {
  try {
    await sequelize.sync({ force: true });

    // Seed Users
    for (const userData of userSeedData) {
      const user = await User.create(userData.User);
    }

    // Seed Groups and UserGroupRoles
    for (const groupData of groupSeedData) {
      const { name, joinPassword, UserGroupRoles } = groupData; // Destructure the data

      const pokerGroup = await PokerGroup.create({ name, joinPassword }); // Include joinPassword

      for (const roleData of UserGroupRoles) {
        let user, userGroupRole;

        user = await User.findByPk(roleData.userId);

        userGroupRole = await UserGroupRole.create({
          role: roleData.role,
        });

        if (user && pokerGroup) {
          await userGroupRole.setUser(user);
          await userGroupRole.setPokerGroup(pokerGroup);
        }
      }
    }
    // Seed Cards
    for (const cardData of cardSeedData) {
      await Deck.create(cardData);
    }

    console.log("Database seeded successfully.");
    // process.exit(0);
  } catch (error) {
    console.error("Error seeding the database:", error);
    throw error;
  }
};

// Only execute the script directly if it's called from the command line
if (require.main === module) {
  seedDatabase(sequelize).catch((error) => {
    console.error("Failed to seed database:", error);
    process.exit(1);
  });
}

module.exports = { seedDatabase };
