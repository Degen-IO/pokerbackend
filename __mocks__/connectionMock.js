const Sequelize = require("sequelize");
// This creates a sqlite instance in memory
const sequelize = new Sequelize("sqlite::memory:", { logging: false });

module.exports = sequelize;
