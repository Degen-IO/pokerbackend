const request = require("supertest");

// Used to generate tokens for testing
module.exports = {
  loginUserAndGetToken: async function (email, password, app) {
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
  },
};
