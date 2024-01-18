const jwt = require("jsonwebtoken");

const secret = "mysecretssshhhhhhh";
const expiration = "4h";

module.exports = {
  signToken: function ({ name, email, userId }) {
    const payload = { name, email, userId };
    return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
  },
  authMiddleware: function ({ req }) {
    // allows token to be sent via req.body, req.query, or headers
    let token = req.body.token || req.query.token || req.headers.authorization;

    // We split the token string into an array and return actual token
    if (req.headers.authorization) {
      token = token.split(" ").pop().trim();
    }

    if (!token) {
      return { ...req, authUserId: null }; // Set authUserId to null if no token is provided
    }

    // if token can be verified, add the decoded user's data to the request so it can be accessed in the resolver
    try {
      const { data } = jwt.verify(token, secret, { maxAge: expiration });
      return { ...req, authUserId: data.userId };
    } catch {
      console.log("Invalid token");
      return { ...req, authUserId: null }; // Set authUserId to null if the token is invalid
    }
  },
};
