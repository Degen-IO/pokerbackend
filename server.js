const PORT = process.env.PORT || 3666;
const sequelize = require("./config/connection");
const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const {
  ApolloServerPluginDrainHttpServer,
} = require("@apollo/server/plugin/drainHttpServer");
const { createServer } = require("http");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");
const cors = require("cors");
const { authMiddleware } = require("./utils/auth");
const { publishMessage } = require("./redis/publishers");
require("./redis/subscribers");
const { pubsub, sessionStore } = require("./config/redis");
const { typeDefs, resolvers } = require("./schemas");

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();
const httpServer = createServer(app);

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});
const serverCleanup = useServer({ schema }, wsServer);

const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

const startApolloServer = async () => {
  await server.start();

  app.use(
    "/graphql",
    cors(),
    express.json(),

    expressMiddleware(server, { context: authMiddleware })
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

  await sequelize.sync();
  httpServer.listen(PORT, () => {
    console.log(`Server is now running on http://localhost:${PORT}/graphql`);
  });
};

startApolloServer();
