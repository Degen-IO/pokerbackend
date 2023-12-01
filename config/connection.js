const Sequelize = require("sequelize");
require("dotenv").config();

let sequelize;

if (process.env.NODE_ENV === "test") {
  sequelize = new Sequelize("sqlite::memory:", { logging: false });
} else {
  // regular Sequelize setup for development/production
  sequelize = new Sequelize(
    process.env.POSTGRES_DB,
    process.env.POSTGRES_USER,
    process.env.POSTGRES_PASSWORD,
    {
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      dialect: "postgres",
    }
  );
}

module.exports = sequelize;
