const request = require("supertest");
const { initializeServer } = require("../config/testConnection");

/* 
This is the GraphQL query + mutation testing 
  Notes:

*/
describe("Server Tests", () => {
  let app, server, sequelize;

  beforeAll(async () => {
    // Initialize server and related components using the shared function
    ({ app, server, sequelize } = await initializeServer());
  });

  afterAll(async () => {
    await sequelize.close(); // Close the Sequelize connection
  });

  /*
   * DEFINE YOUR TESTS HERE
   */
  it("fetches users", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({ query: "{ users { name email } }" });

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveProperty("users");
  });

  // Tests seeds and user Query
  it("fetches all users, should return 5", async () => {
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
    const { users } = response.body.data;
    expect(response.statusCode).toBe(200);
    expect((users.length = 5));
  });

  // CRUD
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
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data.addUser.user");
    expect(response.body.data.addUser.user.name).toBe("Test User");
  });
  // ... more tests
});
