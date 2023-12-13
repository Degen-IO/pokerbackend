const request = require("supertest");
const { initializeServer } = require("../utils/testConnection");
/*
    These are the tests for users, login functionality
*/
describe("Login Functionality", () => {
  let app, server, sequelize;

  beforeAll(async () => {
    ({ app, server, sequelize } = await initializeServer());
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("successfully logs in a user", async () => {
    const loginMutation = `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          token
          user {
            chip_stack
            email
            name
            userId
          }
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .send({
        query: loginMutation,
        variables: {
          email: "user1@example.com",
          password: "password1",
        },
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveProperty("login.token");
    expect(response.body.data.login).toHaveProperty("user");
    expect(response.body.data.login.user.email).toBe("user1@example.com");
  });

  it("fails to log in with incorrect credentials", async () => {
    // Incorrect email or incorrect password,expects an error response
    const loginMutation = `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          token
          user {
            chip_stack
            email
            name
            userId
          }
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .send({
        query: loginMutation,
        variables: {
          email: "user1@example.com",
          password: "notmypassword", // incorrect password
        },
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors[0].message).toBe("Incorrect password!");
    expect(response.body.errors[0].extensions.code).toBe("UNAUTHENTICATED");
    expect(response.body.data.login).toBeNull();
  });

  // Additional tests here
});
