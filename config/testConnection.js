const express = require("express");
const { ApolloServer } = require("@apollo/server");
const cors = require("cors");
const { expressMiddleware } = require("@apollo/server/express4");
const { typeDefs, resolvers } = require("../schemas/index.js");
const sequelize = require("./connection.js");
const { authMiddleware } = require("../utils/auth.js");
const { seedDatabase } = require("../seeders/seed.js");

// This is a modular test server for testing purposes only to be used with Jest
async function initializeServer() {
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
}

module.exports = { initializeServer };
