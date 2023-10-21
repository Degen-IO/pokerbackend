const express = require("express");
const { ApolloServer } = require("apollo-server-express");
// const path = require("path");
const { authMiddleware } = require("./utils/auth");

const { typeDefs, resolvers } = require("./schemas");
//we have set up the sequelize connection in models/index.js for now..
// const db = require("./config/connection");

const PORT = process.env.PORT || 3666;
import models, { sequelize } from "./models";
const sequelize = require("./config/connection");
const models = require("./models");
const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware,
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//re-initialize the db on every Express server start
const eraseDatabaseOnSync = true;

// Create a new instance of an Apollo server with the GraphQL schema
const startApolloServer = async (typeDefs, resolvers) => {
  await server.start();
  server.applyMiddleware({ app });

  sequelize.sync({ force: eraseDatabaseOnSync }).then(async () => {
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}!`);
      console.log(
        `Use GraphQL at http://localhost:${PORT}${server.graphqlPath}`
      );
    });
  });
};

// Call the async function to start the server
startApolloServer(typeDefs, resolvers);
