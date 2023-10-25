const sequelize = require("../config/connection");
const Sequelize = require("sequelize");

const { getUserModel } = require("./User");
const { getCardModel } = require("./Card");
const { getDeckModel } = require("./Deck");
const { getUserGroupRoleModel } = require("./UserGroupRole");
const { getPokerGameModel } = require("./PokerGame");
const { getPokerGroupModel } = require("./PokerGroup");
const { getPlayerActionModel } = require("./PlayerAction");
const { getPlayerHandModel } = require("./PlayerHand");

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

module.exports = { ...models };
