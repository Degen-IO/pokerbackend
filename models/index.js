const sequelize = require("../config/connection");
const Sequelize = require("sequelize");

const { getUserModel } = require("./User");
const { getCardModel } = require("./Card");
const { getDeckModel } = require("./Deck");
const { getUserGroupRoleModel } = require("./UserGroupRole");
const { getCashGameModel } = require("./CashGame");
const { getTournamentGameModel } = require("./TournamentGame");
const { getPokerGroupModel } = require("./PokerGroup");
const { getPlayerModel } = require("./Player");
const { getPlayerActionModel } = require("./PlayerAction");
const { getPlayerHandModel } = require("./PlayerHand");
const { getBlindLevelModel } = require("./BlindLevel");

const models = {
  User: getUserModel(sequelize, Sequelize),
  UserGroupRole: getUserGroupRoleModel(sequelize, Sequelize),
  Player: getPlayerModel(sequelize, Sequelize),
  PlayerAction: getPlayerActionModel(sequelize, Sequelize),
  PlayerHand: getPlayerHandModel(sequelize, Sequelize),
  CashGame: getCashGameModel(sequelize, Sequelize),
  TournamentGame: getTournamentGameModel(sequelize, Sequelize),
  PokerGroup: getPokerGroupModel(sequelize, Sequelize),
  Card: getCardModel(sequelize, Sequelize),
  Deck: getDeckModel(sequelize, Sequelize),
  BlindLevel: getBlindLevelModel(sequelize, Sequelize),
};

Object.keys(models).forEach((key) => {
  if ("associate" in models[key]) {
    models[key].associate(models);
  }
});

module.exports = { ...models };
