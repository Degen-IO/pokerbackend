const express = require("express");
const { ApolloServer } = require("@apollo/server");
const cors = require("cors");
const { expressMiddleware } = require("@apollo/server/express4");
const { typeDefs, resolvers } = require("../schemas");
const request = require("supertest");
const sequelize = require("../config/connection.js");
const { authMiddleware } = require("../utils/auth.js");
const { seedDatabase } = require("../seeders/seed");

// Mocks (adjust according to your actual implementation)
jest.mock("../config/connection", () => require("../__mocks__/connectionMock"));

describe("GraphQL Server Tests", () => {
  let app;
  let server;

  beforeAll(async () => {
    app = express();
    server = new ApolloServer({ typeDefs, resolvers });

    // Initialize and sync Sequelize models
    // await sequelize.sync({ force: true });
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
  });

  afterAll(async () => {
    await sequelize.close(); // Close the Sequelize connection
  });

  // TESTS

  it("fetches users", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({ query: "{ users { name email } }" });

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveProperty("users");
  });

  it("fetches all users", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
            query Users {
                users {
                chip_stack
                name
                email
                userId
                }
            }
        `,
      });
    console.log(response.body.data);
    expect(response.statusCode).toBe(200);
    expect(response.body);
  });

  it("adds a user", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            addUser(name: "Test User", email: "test@example.com", password: "password123") {
              user {
                name
                email
              }
            }
          }
        `,
      });

    console.log(response.body); // Log the entire response body

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data.addUser.user");
    expect(response.body.data.addUser.user.name).toBe("Test User");
  });
});
