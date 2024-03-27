const express = require("express");
const http = require("http");
const { ApolloServer } = require("@apollo/server");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");
const cors = require("cors");
const { expressMiddleware } = require("@apollo/server/express4");
const { typeDefs, resolvers } = require("../schemas/index.js");
const sequelize = require("../config/connection.js");
const { authMiddleware } = require("./auth.js");
const { seedDatabase } = require("../seeders/seed.js");
const { makeExecutableSchema } = require("@graphql-tools/schema");

const schema = makeExecutableSchema({ typeDefs, resolvers });

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

  initializeWebsocketServer: async function () {
    const app = express();
    const httpServer = http.createServer(app);

    // Initialize the ApolloServer with the schema
    const server = new ApolloServer({ typeDefs, resolvers });

    await seedDatabase(sequelize);
    await server.start();
    app.use(
      "/graphql",
      cors(),
      express.json(),
      expressMiddleware(server, {
        context: authMiddleware, // Ensure context is passed correctly
      })
    );

    const wsServer = new WebSocketServer({
      server: httpServer,
      path: "/graphql",
    });

    // Use the schema with the WebSocket server
    const subscriptionServer = useServer({ schema }, wsServer);

    // Listen on a random available port
    await new Promise((resolve) => httpServer.listen(0, resolve));
    const { port } = httpServer.address();

    console.log(
      `Test server is now running on http://localhost:${port}/graphql`
    );

    return {
      app,
      server,
      sequelize,
      httpServer,
      wsServer,
      port, // Make sure to return the port for dynamic assignment
      cleanup: async () => {
        await subscriptionServer.dispose();
        await server.stop();
        await sequelize.close();
        httpServer.close();
      },
    };
  },
};
