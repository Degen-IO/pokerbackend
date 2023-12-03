const request = require("supertest");
const { initializeServer } = require("../config/testConnection");
const { signToken } = require("../utils/auth");

describe("Server and Middleware Tests", () => {
  let app, server, sequelize, validUserId, validToken, updateUserMutation;

  beforeAll(async () => {
    // Initialize server and related components using the shared function
    ({ app, server, sequelize } = await initializeServer());
    validUserId = 1;
    validToken = signToken({
      name: "Test User",
      email: "test@example.com",
      userId: validUserId,
    });

    // Define the updateUserMutation here so it's accessible in all tests within this describe block, this was just chosen as it uses context
    updateUserMutation = `
      mutation UpdateUser($userId: ID!, $name: String) {
        updateUser(userId: $userId, name: $name) {
          message
          user {
            name
          }
        }
      }
    `;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // Tests related to general server functionality, like the GQL endpoint. May be worth reorganizing later?
  describe("General Server Functionality", () => {
    it("GraphQL endpoint is available", async () => {
      const response = await request(app)
        .post("/graphql")
        .send({ query: "{ __typename }" });

      expect(response.statusCode).toBe(200);
      expect(response.body.data.__typename).toBeTruthy();
    });
    // Other general server functionality tests here
  });

  // Tests related to Auth Middleware functionality
  describe("Auth Middleware in updateUser Mutation", () => {
    it("rejects updateUser mutation without valid authentication", async () => {
      // Request without a valid token
      const response = await request(app)
        .post("/graphql")
        .send({
          query: updateUserMutation,
          variables: { userId: validUserId, name: "New Name" },
        });

      // Expect an error indicating the user is not authenticated
      expect(response.statusCode).toBe(200);
      expect(response.body.errors[0].message).toContain("not authorized");
    });

    it("allows updateUser mutation with valid authentication", async () => {
      // Simulate a request WITH a valid token
      const response = await request(app)
        .post("/graphql")
        .set("Authorization", `Bearer ${validToken}`) // Set the valid token in the request header
        .send({
          query: updateUserMutation,
          variables: { userId: validUserId, name: "New Name" },
        });

      // Expect a successful response
      expect(response.statusCode).toBe(200);
      expect(response.body.data.updateUser.message).toBe(
        "User successfully updated"
      );
    });

    // Other auth middleware related tests
  });

  // Additional nested describe blocks for other categories of tests (TO DO)
});
