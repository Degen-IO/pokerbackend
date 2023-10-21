const sequelize = require("../config/connection");
const { User, UserGroupRole, PokerGroup, Card } = require("../models");
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

// Add this code before your loop for debugging

const seedDatabase = async () => {
  try {
    await sequelize.sync({ force: true });

    // Seed Users
    for (const userData of userSeedData) {
      const user = await User.create(userData.User);
    }

    // Seed Groups and UserGroupRoles
    for (const groupData of groupSeedData) {
      const pokerGroup = await PokerGroup.create({ name: groupData.name });

      for (const roleData of groupData.UserGroupRoles) {
        let user, userGroupRole;

        console.log(groupData.UserGroupRoles);

        user = await User.findByPk(roleData.userId);

        console.log("Retrieved user:", user);

        userGroupRole = await UserGroupRole.create({
          role: roleData.role,
          // userId: roleData.userId,
        });

        const pokerGroup = await PokerGroup.findOne({
          where: { name: groupData.name },
        });
        console.log("Retrieved pokerGroup:", pokerGroup);

        if (user && pokerGroup) {
          await userGroupRole.setUser(user);
          await userGroupRole.setPokerGroup(pokerGroup);
        }
      }
    }

    // Seed Cards
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
