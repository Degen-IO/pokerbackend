// Test helpers for dates
module.exports = {
  // Helper functions to acquire auth tokens
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
  // Helper Date Utils
  makeFutureDate: function () {
    // Get the current date
    const currentDate = new Date();

    // Add 5 days
    currentDate.setDate(currentDate.getDate() + 5);

    // Set the time to 12 PM
    currentDate.setHours(12, 0, 0, 0); // 12 hours, 0 minutes, 0 seconds, 0 milliseconds

    // Convert to ISO string
    const futureDateTimeISO = currentDate.toISOString();

    return futureDateTimeISO;
  },
  makePastDate: function () {
    // Get the current date
    const currentDate = new Date();

    // Subtract 5 minutes + convert to ISO
    currentDate.setMinutes(currentDate.getMinutes() - 5);
    const pastDateTimeISO = currentDate.toISOString();
    return pastDateTimeISO;
  },
  makeBadFutureDate: function () {
    // Get the current date
    const currentDate = new Date();

    // Add 1 year
    currentDate.setFullYear(currentDate.getFullYear() + 1);

    // Add 1 day
    currentDate.setDate(currentDate.getDate() + 1);

    // Convert to ISO string
    const futureDateTimeISO = currentDate.toISOString();

    return futureDateTimeISO;
  },
};
