const { AuthenticationError } = require("apollo-server-express");
const { Op } = require("sequelize");

const bcrypt = require("bcryptjs");
const {
  User,
  UserGroupRole,
  PokerGroup,
  CashGame,
  TournamentGame,
  PlayerAction,
  PlayerHand,
  Card,
  Deck,
} = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    users: async () => {
      return User.findAll();
    },

    user: async (parent, { userId }) => {
      return User.findByPk(userId);
    },
    pokerGroups: async (parent, { userId }) => {
      // Fetch and return poker groups associated with the specified user ID
      try {
        const user = await User.findByPk(userId);
        if (!user) {
          throw new Error("User not found");
        }

        // Use the UserGroupRole model to find groups where the user is an admin or member
        const userGroupRoles = await UserGroupRole.findAll({
          where: {
            userId,
            role: {
              [Op.in]: ["admin", "member"],
            },
          },
        });

        const groupIds = userGroupRoles.map((role) => role.groupId);

        // Use the groupIds to fetch the PokerGroups associated with the user
        const pokerGroups = await PokerGroup.findAll({
          where: {
            groupId: {
              [Op.in]: groupIds,
            },
          },
        });

        return pokerGroups;
      } catch (error) {
        console.error("Error fetching poker groups:", error);
        throw error;
      }
    },
    pendingMembers: async (parent, { groupId }, context) => {
      // Check if the user is authorized to view pending members
      if (!context.authUserId) {
        throw new AuthenticationError(
          "You must be logged in to view pending members"
        );
      }

      // Check if the user is an admin of the specified poker group
      const isAdmin = await UserGroupRole.findOne({
        where: {
          groupId: groupId,
          userId: context.authUserId,
          role: "admin",
        },
      });

      if (!isAdmin) {
        throw new AuthenticationError(
          "You are not authorized to view pending members for this group"
        );
      }

      const pendingMembers = await User.findAll({
        include: {
          model: UserGroupRole, // Include UserGroupRole model
          where: {
            groupId: groupId,
            role: "pending", // Filter for pending members
          },
        },
      });

      return pendingMembers;
    },
    membersOfGroup: async (parent, { groupId }) => {
      // Fetch and return members of the specified group
      const members = await User.findAll({
        include: [
          {
            model: UserGroupRole,
            where: {
              groupId,
              role: ["member", "admin"],
            },
          },
        ],
      });

      return members;
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
        const user = await User.findOne({
          where: { email: email },
        });

        if (!user) {
          // Log and throw an error
          console.error("No user with this email found!");
          throw new AuthenticationError("No user with this email found!");
        }

        const correctPw = await user.isCorrectPassword(password);

        if (!correctPw) {
          // Log and throw an error
          console.error("Incorrect password!");
          throw new AuthenticationError("Incorrect password!");
        }

        const token = signToken(user);

        return { token, user };
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },

    updateUser: async (parent, { userId, name, email, password }, context) => {
      const contextAuthUserId = parseInt(context.authUserId);
      const userIdInt = parseInt(userId);

      if (contextAuthUserId !== userIdInt) {
        throw new Error("You are not authorized to update this profile");
      }
      try {
        const user = await User.findByPk(userId);

        if (!user) {
          throw new Error("User not found");
        }

        if (name) {
          user.name = name;
        }

        if (email) {
          user.email = email;
        }

        if (password) {
          if (password.length < 5 || password.length > 255) {
            throw new Error(
              "Password must be between 5 and 255 characters long"
            );
          }

          const saltRounds = 10;
          user.password = await bcrypt.hash(password, saltRounds);
        }

        await user.save();

        return { message: "User successfully updated", user };
      } catch (error) {
        console.error("Update user error:", error);
        throw error;
      }
    },

    removeUser: async (parent, { userId }, context) => {
      const contextAuthUserId = parseInt(context.authUserId);
      const userIdInt = parseInt(userId);

      if (contextAuthUserId !== userIdInt) {
        throw new Error("You are not authorized to remove this user");
      }

      try {
        const user = await User.findByPk(userIdInt);

        if (!user) {
          throw new Error("User not found");
        }

        // Delete the user
        await user.destroy();

        // Return some confirmation message or the deleted user's data
        return { message: "User successfully removed" };
      } catch (error) {
        console.error("Remove user error:", error);
        throw error;
      }
    },

    createPokerGroup: async (parent, { name, joinPassword }, context) => {
      // Check if the user is authorized to create a group
      if (!context.authUserId) {
        throw new AuthenticationError(
          "You must be logged in to create a group"
        );
      }

      try {
        const group = await PokerGroup.create({
          name,
          joinPassword,
        });

        // You may want to associate the user who created the group as an admin
        const userGroupRole = await UserGroupRole.create({
          userId: context.authUserId,
          groupId: group.groupId,
          role: "admin",
        });

        return group;
      } catch (error) {
        console.error("Create poker group error:", error);
        throw error;
      }
    },
    deletePokerGroup: async (parent, { groupId }, context) => {
      // Check if the user is authorized to delete the group
      if (!context.authUserId) {
        throw new AuthenticationError(
          "You must be logged in to delete a group"
        );
      }

      const group = await PokerGroup.findByPk(groupId);

      if (!group) {
        throw new Error("Group not found");
      }

      // Check if the user is an admin of the group
      const isAdmin = await UserGroupRole.findOne({
        where: {
          groupId,
          userId: context.authUserId,
          role: "admin",
        },
      });

      if (!isAdmin) {
        throw new Error("You are not authorized to delete this group");
      }

      // Delete the group
      await group.destroy();

      return "Group successfully deleted";
    },
    requestToJoinGroup: async (parent, { groupId, joinPassword }, context) => {
      if (!context.authUserId) {
        throw new AuthenticationError("You must be logged in to join a group");
      }

      try {
        const user = await User.findByPk(context.authUserId);
        const group = await PokerGroup.findByPk(groupId);

        if (!group) {
          throw new Error("Group not found");
        }

        if (group.joinPassword !== joinPassword) {
          throw new Error("Incorrect group password");
        }

        const existingRole = await UserGroupRole.findOne({
          where: {
            userId: user.userId,
            groupId: group.groupId,
          },
        });

        if (existingRole) {
          throw new Error("You are already a member of this group.");
        }

        // Create a new UserGroupRole entry for the user with the "pending" role
        await UserGroupRole.create({
          userId: user.userId,
          groupId: group.groupId,
          role: "pending",
        });

        return group;
      } catch (error) {
        console.error("Request to join group error:", error);
        throw error;
      }
    },
    approvePendingMember: async (parent, { groupId, userId }, context) => {
      // Check if the user is authorized to approve pending members (admin of the group)
      const isAdmin = await UserGroupRole.findOne({
        where: {
          groupId,
          userId: context.authUserId,
          role: "admin",
        },
      });

      if (!isAdmin) {
        throw new AuthenticationError(
          "You are not authorized to approve pending members for this group"
        );
      }

      // Check if the user to be approved is a pending member of the group
      const pendingMember = await UserGroupRole.findOne({
        where: {
          groupId,
          userId,
          role: "pending",
        },
      });

      if (!pendingMember) {
        throw new Error("User is not a pending member of this group");
      }

      // Approve the user by changing their role to "member"
      pendingMember.role = "member";
      await pendingMember.save();

      // Fetch and return the updated group
      const group = await PokerGroup.findByPk(groupId);
      return group;
    },
    removeGroupMember: async (parent, { groupId, userId }, context) => {
      // Check if the user is authorized to remove a member (admin of the group) or is the user themselves
      const userIdInt = parseInt(userId);
      const parsedContextId = parseInt(context.authUserId);

      const isAdmin = await UserGroupRole.findOne({
        where: {
          groupId,
          userId: context.authUserId,
          role: "admin",
        },
      });

      const isSelfRemoval = parsedContextId === userIdInt;

      if (!isAdmin && !isSelfRemoval) {
        throw new AuthenticationError(
          "You are not authorized to remove members from this group"
        );
      }

      // Check if the user to be removed is a member of the group
      const member = await UserGroupRole.findOne({
        where: {
          groupId,
          userId,
          role: "member",
        },
      });

      if (isSelfRemoval && isAdmin) {
        throw new Error("An admin cannot remove themselves from the group");
      }

      if (!member) {
        throw new Error("User is not a member of this group");
      }

      // Remove the user from the group
      await member.destroy();

      return "Member successfully removed from the group";
    },

    createCashGame: async (parent, args, context) => {
      try {
        // Check if the user is authorized to create a Cash Game (e.g., user is a member or admin of the group)
        // You can use context.authUserId to check the user's authorization.

        if (!context.authUserId) {
          throw new AuthenticationError(
            "You must be logged in to create a game"
          );
        }

        // Find the group associated with the game
        const group = await PokerGroup.findByPk(args.groupId);

        if (!group) {
          throw new Error("Group not found");
        }

        // Check if the user is a member or admin of the group
        const userRole = await UserGroupRole.findOne({
          where: {
            groupId: args.groupId,
            userId: context.authUserId,
            role: ["admin", "member"],
          },
        });

        if (!userRole) {
          throw new AuthenticationError(
            "You are not authorized to create a game in this group"
          );
        }

        // Parse startDateTime and calculate the minimum allowed datetime (5 minutes in the future)
        const startDateTime = new Date(args.startDateTime);
        const minAllowedDateTime = new Date();
        minAllowedDateTime.setMinutes(minAllowedDateTime.getMinutes() + 5);

        // Check if startDateTime is at least 5 minutes in the future
        if (startDateTime <= minAllowedDateTime) {
          throw new Error(
            "Start date and time must be at least 5 minutes in the future."
          );
        }

        // Create the Cash Game using the args passed in, and associate it with the specified group.
        // You may also associate the user who is creating the game.

        const cashGame = await CashGame.create({
          name: args.name,
          status: "waiting",
          startDateTime: args.startDateTime,
          playersPerTable: args.playersPerTable,
          startingChips: args.startingChips,
          blindsSmall: args.blindsSmall,
          blindsBig: args.blindsBig,
          duration: args.duration,
          groupId: args.groupId, // Associate with the group
          userId: context.authUserId, // Associate with the user
        });

        return cashGame;
      } catch (error) {
        console.error("Error while creating CashGame:", error.message);
        throw error;
      }
    },

    createTournamentGame: async (parent, args, context) => {
      // Check if the user is authorized to create a Tournament Game (e.g., user is a member or admin of the group)
      // You can use context.authUserId to check the user's authorization.

      if (!context.authUserId) {
        throw new AuthenticationError("You must be logged in to create a game");
      }

      // Find the group associated with the game
      const group = await PokerGroup.findByPk(args.groupId);

      if (!group) {
        throw new Error("Group not found");
      }

      // Check if the user is a member or admin of the group
      const userRole = await UserGroupRole.findOne({
        where: {
          groupId: args.groupId,
          userId: context.authUserId,
          role: ["admin", "member"],
        },
      });

      if (!userRole) {
        throw new AuthenticationError(
          "You are not authorized to create a game in this group"
        );
      }

      // Parse startDateTime and calculate the minimum allowed datetime (5 minutes in the future)
      const startDateTime = new Date(args.startDateTime);
      const minAllowedDateTime = new Date();
      minAllowedDateTime.setMinutes(minAllowedDateTime.getMinutes() + 5);

      // Check if startDateTime is at least 5 minutes in the future
      if (startDateTime <= minAllowedDateTime) {
        throw new Error(
          "Start date and time must be at least 5 minutes in the future."
        );
      }

      // Create the Tournament Game using the args passed in, and associate it with the specified group.
      // You may also associate the user who is creating the game.

      const tournamentGame = await TournamentGame.create({
        name: args.name,
        status: "waiting",
        startDateTime: args.startDateTime,
        playersPerTable: args.playersPerTable,
        numberOfRebuys: args.numberOfRebuys,
        rebuyPeriod: args.rebuyPeriod,
        addOn: args.addOn,
        startingChips: args.startingChips,
        gameSpeed: args.gameSpeed,
        lateRegistrationDuration: args.lateRegistrationDuration,
        groupId: args.groupId, // Associate with the group
        userId: context.authUserId, // Associate with the user
      });

      return tournamentGame;
    },
    deleteGame: async (parent, { gameId, gameType }, context) => {
      // Check if the user is authenticated
      if (!context.authUserId) {
        throw new AuthenticationError("You must be logged in to delete a game");
      }

      // Find the game by ID
      let game;

      if (gameType === "cash") {
        game = await CashGame.findByPk(gameId);
      } else if (gameType === "tournament") {
        game = await TournamentGame.findByPk(gameId);
      } else {
        throw new Error("Invalid game type");
      }

      if (!game) {
        throw new Error("Game not found");
      }

      // Check if the user is the creator of the game or an admin of the group
      const isAdmin = await UserGroupRole.findOne({
        where: {
          groupId: game.groupId,
          userId: context.authUserId,
          role: "admin",
        },
      });

      if (game.userId !== context.authUserId && !isAdmin) {
        throw new AuthenticationError(
          "You are not authorized to delete this game"
        );
      }

      // If it's a tournament game, check if its status is "waiting"
      if (gameType === "tournament" && game.status !== "waiting") {
        throw new Error(
          "Tournament game can only be deleted if its status is 'waiting'"
        );
      }

      // Delete the game
      await game.destroy();

      return "Game successfully deleted";
    },
  },
};

module.exports = resolvers;
