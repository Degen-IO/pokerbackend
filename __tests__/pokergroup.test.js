const request = require("supertest");
const { initializeServer } = require("../config/testConnection");
const { PokerGroup, User, UserGroupRole } = require("../models");
// ... other model imports as needed

describe("PokerGroup CRUD Operations", () => {
  let app, server, sequelize;
  let authToken;
  let authToken2;

  beforeAll(async () => {
    ({ app, server, sequelize } = await initializeServer());
    // User 1 = Admin in Group 1
    authToken = await loginUserAndGetToken(
      "user1@example.com",
      "password1",
      app
    );
    // User 2 = Not an Admin, nor in Group 1
    authToken2 = await loginUserAndGetToken(
      "user5@example.com",
      "password5",
      app
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // Example Test for Fetching Poker Groups
  it("fetches poker groups for a user", async () => {
    const query = `
        query Query($userId: ID!) {
            pokerGroups(userId: $userId) {
            groupId
            joinPassword
            name
            }
        }
    `;

    const response = await request(app)
      .post("/graphql")
      .send({
        query,
        variables: {
          userId: "1",
        },
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveProperty("pokerGroups");
    // Further assertions based on your seeded test data
  });

  it("requests user5 to join user1 group", async () => {
    const query = `
        mutation Mutation($groupId: ID!, $joinPassword: String!) {
            requestToJoinGroup(groupId: $groupId, joinPassword: $joinPassword) {
              groupId
              joinPassword
              name
            }
          }
    `;

    const groupId = "1";
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken2}`)
      .send({
        query,
        variables: {
          groupId,
          joinPassword: "password1",
        },
      });
    expect(response.body.data.requestToJoinGroup.groupId === "1");
  });

  //Test for fetching pending members as an admin
  it("fetches pending members for a group as an admin, should be userId 5 is the only pending member ", async () => {
    const query = `
        query Query($groupId: ID!) {
            pendingMembers(groupId: $groupId) {
            chip_stack
            email
            name
            userId
            }
        }
          `;

    const groupId = "1";

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`) // Set the auth token if needed
      .send({
        query,
        variables: {
          groupId,
        },
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveProperty("pendingMembers");
    expect(response.body.data.pendingMembers.length == 1);
    expect(response.body.data.pendingMembers[0].userId === "5");
    // Add further assertions based on your seeded test data
  });

  // Test for unauthorized access to pending members
  it("denies access to non-admin users", async () => {
    const query = `
            query PendingMembers($groupId: ID!) {
              pendingMembers(groupId: $groupId) {
                userId
                name
                email
              }
            }
          `;

    const groupId = "1";

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken2}`) // Not an admin
      .send({
        query,
        variables: {
          groupId,
        },
      });

    expect(response.statusCode).toBe(200); // GraphQL often returns 200 even for errors
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors[0].message).toContain("not authorized");
  });
});

// Helper functions to aquire auth tokens
async function loginUserAndGetToken(email, password, app) {
  const loginMutation = `
        mutation Login($email: String!, $password: String!) {
            login(email: $email, password: $password) {
                token
            }
        }
    `;

  const response = await request(app)
    .post("/graphql")
    .send({
      query: loginMutation,
      variables: {
        email: email,
        password: password,
      },
    });

  return response.body.data.login.token;
}
