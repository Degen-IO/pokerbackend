const express = require("express");
const { ApolloServer } = require("@apollo/server");
const cors = require("cors");
const { expressMiddleware } = require("@apollo/server/express4");
const { typeDefs, resolvers } = require("../schemas/index.js");
const sequelize = require("../config/connection.js");
const { authMiddleware } = require("./auth.js");
const { seedDatabase } = require("../seeders/seed.js");

// This is a modular test server for testing purposes only to be used with Jest

module.exports = {
  initializeServer: async function () {
    const app = express();
    const server = new ApolloServer({ typeDefs, resolvers });

    // Initialize and sync Sequelize models
    await seedDatabase(sequelize);

    await server.start();
    app.use(
      "/graphql",
      cors(),
      express.json(),
      expressMiddleware(server, {
        context: authMiddleware,
      })
    );

    return { app, server, sequelize };
  },
};
