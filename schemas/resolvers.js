const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    users: async () => {
      return User.find();
    },

    user: async (parent, { userId }) => {
      return User.findOne({ _id: userId });
    },
  },

  Mutation: {
    addUser: async (parent, { name, email, password }) => {
      const user = await User.create({ name, email, password });
      const token = signToken(user);

      return { token, user };
    },
    login: async (parent, { email, password }) => {
      try {
        // Log the inputs
        console.log("Login attempt with email:", email);

        const user = await User.findOne({
          where: { email: email },
        });

        // Log the user object (if found)
        console.log("User found:", user);

        if (!user) {
          // Log and throw an error
          console.error("No user with this email found!");
          throw new AuthenticationError("No user with this email found!");
        }

        const correctPw = await user.isCorrectPassword(password);

        // Log the result of password comparison
        console.log("Password comparison result:", correctPw);

        if (!correctPw) {
          // Log and throw an error
          console.error("Incorrect password!");
          throw new AuthenticationError("Incorrect password!");
        }

        const token = signToken(user);

        // Log the token
        console.log("Token generated:", token);

        return { token, user };
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },

    removeUser: async (parent, { _id }) => {
      return User.findOneAndDelete({ _id });
    },
  },
};

module.exports = resolvers;
