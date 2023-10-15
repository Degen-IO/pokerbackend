const Sequelize = require("sequelize");
require("dotenv").config();
const { getUserModel } = require("./User");
const { getPlayerModel } = require("./Player");

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
  Player: getPlayerModel(sequelize, Sequelize),
};

Object.keys(models).forEach((key) => {
  if ("associate" in models[key]) {
    models[key].associate(models);
  }
});

module.exports = { sequelize, ...models };
