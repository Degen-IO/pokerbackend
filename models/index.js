const Sequelize = require("sequelize");
require("dotenv").config();
const { getUserModel } = require("./User");
const { getCardModel } = require("./Card");
const { getDeckModel } = require("./Deck");
const { getUserGroupRoleModel } = require("./UserGroupRole");
const { getPokerGameModel } = require("./PokerGame");
const { getPokerGroupModel } = require("./PokerGroup");
const { getPlayerActionModel } = require("./PlayerAction");
const { getPlayerHandModel } = require("./PlayerHand");

const sequelize = new Sequelize(
  process.env.PGDATABASE,
  process.env.PGUSER,
  process.env.PGPASSWORD,
  {
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    dialect: "postgres",
  }
);

const models = {
  User: getUserModel(sequelize, Sequelize),
  UserGroupRole: getUserGroupRoleModel(sequelize, Sequelize),
  PlayerAction: getPlayerActionModel(sequelize, Sequelize),
  PlayerHand: getPlayerHandModel(sequelize, Sequelize),
  PokerGame: getPokerGameModel(sequelize, Sequelize),
  PokerGroup: getPokerGroupModel(sequelize, Sequelize),
  Card: getCardModel(sequelize, Sequelize),
  Deck: getDeckModel(sequelize, Sequelize),
};

Object.keys(models).forEach((key) => {
  if ("associate" in models[key]) {
    models[key].associate(models);
  }
});

module.exports = { sequelize, ...models };
