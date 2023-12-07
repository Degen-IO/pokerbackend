const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const { authMiddleware } = require("./utils/auth");
const cors = require("cors");
const { publishMessage } = require("./redis/publishers");
require("./redis/subscribers");
// Import Redis configuration
const { pubsub, sessionStore } = require("./config/redis");
const { typeDefs, resolvers } = require("./schemas");

const PORT = process.env.PORT || 3666;
const sequelize = require("./config/connection");
const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Create a new instance of an Apollo server with the GraphQL schema
const startApolloServer = async (typeDefs, resolvers) => {
  await server.start();

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: authMiddleware,
    })
  );

  app.get("/test-redis", async (req, res) => {
    try {
      await sessionStore.set("testKey", "Hello, Redis!");
      const value = await sessionStore.get("testKey");
      res.send(`Redis response: ${value}`);
    } catch (err) {
      res.status(500).send(`Error connecting to Redis: ${err.message}`);
    }
  });

  app.get("/publish/:message", (req, res) => {
    const message = req.params.message;
    publishMessage("testChannel", message);
    res.send(`Published message: ${message}`);
  });

  sequelize.sync().then(async () => {
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}!`);
      console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
    });
  });
};

startApolloServer(typeDefs, resolvers);
