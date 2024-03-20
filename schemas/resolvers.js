const { GraphQLError } = require("graphql");
const { Op } = require("sequelize");
const { pubsub, redisSubscriber, redisPublisher } = require("../config/redis");

const bcrypt = require("bcryptjs");
const {
  User,
  UserGroupRole,
  PokerGroup,
  CashGame,
  TournamentGame,
  Player,
  Table,
  PlayerAction,
  PlayerHand,
  Card,
  Deck,
} = require("../models");
const { signToken } = require("../utils/auth");
const { findAvailableSeatNumber } = require("../utils/findAvailableSeatNumber");
const { findOrCreateTable } = require("../utils/findOrCreateTable");
const {
  hasLateRegistrationExpired,
} = require("../utils/hasLateRegistrationExpired");
const {
  createShuffledDeck,
  distributeCards,
} = require("../utils/shuffleAndDistribute");
const { publishMessage } = require("../redis/publishers");

const resolvers = {
  Query: {
    users: async () => {
      return User.findAll();
    },

    user: async (parent, { userId }) => {
      return User.findByPk(userId);
    },
    userGames: async (parent, { userId }, context) => {
      // Check if the user is authorized to view games
      //technically could view other user's games as long as theyre logged in, but we could alter this if needed
      if (!context.authUserId) {
        throw new GraphQLError(
          "You must be logged in to view Cash Games in the group",
          {
            extensions: {
              code: "UNAUTHENTICATED",
            },
          }
        );
      }
      try {
        const user = await User.findByPk(userId);

        if (!user) {
          throw new Error("User not found");
        }

        // Find all Player entries associated with the user
        const playerEntries = await Player.findAll({
          where: { userId },
        });

        // Extract gameIds and gameTypes from the playerEntries
        const gameEntries = playerEntries.map(({ gameId, gameType }) => ({
          gameId,
          gameType,
        }));

        // Find all games (both cash and tournament) associated with the extracted gameEntries
        const games = await Promise.all(
          gameEntries.map(async ({ gameId, gameType }) => {
            if (gameType === "cash") {
              return CashGame.findByPk(gameId);
            } else if (gameType === "tournament") {
              return TournamentGame.findByPk(gameId);
            }
            return null;
          })
        );

        return games;
      } catch (error) {
        console.error("Error fetching user games:", error);
        throw error;
      }
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
        throw new GraphQLError(
          "You must be logged in to view pending members",
          {
            extensions: {
              code: "UNAUTHENTICATED",
            },
          }
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
        throw new GraphQLError(
          "You are not authorized to view pending members for this group",
          {
            extensions: {
              code: "UNAUTHENTICATED",
            },
          }
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
    cashGamesInGroup: async (parent, { groupId }, context) => {
      // Check if the user is authorized to view Cash Games in the group
      if (!context.authUserId) {
        throw new GraphQLError(
          "You must be logged in to view Cash Games in the group",
          {
            extensions: {
              code: "UNAUTHENTICATED",
            },
          }
        );
      }

      // Check if the user is a member or admin of the specified group
      const userRole = await UserGroupRole.findOne({
        where: {
          groupId,
          userId: context.authUserId,
          role: ["admin", "member"],
        },
      });

      if (!userRole) {
        throw new GraphQLError(
          "You are not authorized to view Cash Games in this group",
          {
            extensions: {
              code: "UNAUTHENTICATED",
            },
          }
        );
      }

      // Fetch and return Cash Games associated with the specified group
      const cashGames = await CashGame.findAll({
        where: {
          groupId,
        },
      });

      return cashGames;
    },

    tournamentGamesInGroup: async (parent, { groupId }, context) => {
      // Check if the user is authorized to view Tournament Games in the group
      if (!context.authUserId) {
        throw new GraphQLError(
          "You must be logged in to view Tournament Games in the group",
          {
            extensions: {
              code: "UNAUTHENTICATED",
            },
          }
        );
      }

      // Check if the user is a member or admin of the specified group
      const userRole = await UserGroupRole.findOne({
        where: {
          groupId,
          userId: context.authUserId,
          role: ["admin", "member"],
        },
      });

      if (!userRole) {
        throw new GraphQLError(
          "You are not authorized to view Tournament Games in this group",
          {
            extensions: {
              code: "UNAUTHENTICATED",
            },
          }
        );
      }

      // Fetch and return Tournament Games associated with the specified group
      const tournamentGames = await TournamentGame.findAll({
        where: {
          groupId,
        },
      });

      return tournamentGames;
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
          throw new GraphQLError("No user with this email found!", {
            extensions: {
              code: "UNAUTHENTICATED",
            },
          });
        }

        const correctPw = await user.isCorrectPassword(password);

        if (!correctPw) {
          // Log and throw an error
          console.error("Incorrect password!");
          throw new GraphQLError("Incorrect password!", {
            extensions: {
              code: "UNAUTHENTICATED",
            },
          });
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
        throw new GraphQLError("You must be logged in to create a group", {
          extensions: {
            code: "UNAUTHENTICATED",
          },
        });
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
        throw new GraphQLError("You must be logged in to delete a group", {
          extensions: {
            code: "UNAUTHENTICATED",
          },
        });
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
        throw new GraphQLError("You must be logged in to join a group", {
          extensions: {
            code: "UNAUTHENTICATED",
          },
        });
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
        throw new GraphQLError(
          "You are not authorized to approve pending members for this group",
          {
            extensions: {
              code: "UNAUTHENTICATED",
            },
          }
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
        throw new GraphQLError(
          "You are not authorized to remove members from this group",
          {
            extensions: {
              code: "UNAUTHENTICATED",
            },
          }
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
          throw new GraphQLError("You must be logged in to create a game", {
            extensions: {
              code: "UNAUTHENTICATED",
            },
          });
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
          throw new GraphQLError(
            "You are not authorized to create a game in this group",
            {
              extensions: {
                code: "UNAUTHENTICATED",
              },
            }
          );
        }

        // Parse startDateTime and calculate the maximum allowed datetime (1 year in the future)
        const startDateTime = new Date(args.startDateTime);
        const maxAllowedDateTime = new Date();
        maxAllowedDateTime.setFullYear(maxAllowedDateTime.getFullYear() + 1);

        // Calculate the minimum allowed datetime (5 minutes in the future)
        const minAllowedDateTime = new Date();
        minAllowedDateTime.setMinutes(minAllowedDateTime.getMinutes() + 5);

        // Check if startDateTime is within the allowed range (between 5 minutes and 1 year in the future)
        if (startDateTime <= minAllowedDateTime) {
          throw new Error(
            "Start date and time must be at least 5 minutes in the future."
          );
        }

        if (startDateTime > maxAllowedDateTime) {
          throw new Error(
            "Start date and time can't be more than 1 year in the future."
          );
        }

        // Create the Cash Game using the args passed in, and associate it with the specified group.
        // You may also associate the user who is creating the game.

        const cashGame = await CashGame.create({
          name: args.name,
          gameType: "cash",
          status: "waiting",
          startDateTime: args.startDateTime,
          playersPerTable: args.playersPerTable,
          startingChips: args.startingChips,
          blindsSmall: args.blindsSmall,
          blindsBig: args.blindsBig,
          duration: args.duration,
          groupId: args.groupId,
          userId: context.authUserId,
        });

        // // Create the initial table for the Cash Game
        // await Table.create({
        //   gameId: cashGame.gameId,
        //   gameType: "cash",
        //   // Add any necessary attributes for the table
        // });

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
        throw new GraphQLError("You must be logged in to create a game", {
          extensions: {
            code: "UNAUTHENTICATED",
          },
        });
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
        throw new GraphQLError(
          "You are not authorized to create a game in this group",
          {
            extensions: {
              code: "UNAUTHENTICATED",
            },
          }
        );
      }

      // Parse startDateTime and calculate the maximum allowed datetime (1 year in the future)
      const startDateTime = new Date(args.startDateTime);
      const maxAllowedDateTime = new Date();
      maxAllowedDateTime.setFullYear(maxAllowedDateTime.getFullYear() + 1);

      // Calculate the minimum allowed datetime (5 minutes in the future)
      const minAllowedDateTime = new Date();
      minAllowedDateTime.setMinutes(minAllowedDateTime.getMinutes() + 5);

      // Check if startDateTime is within the allowed range (between 5 minutes and 1 year in the future)
      if (startDateTime <= minAllowedDateTime) {
        throw new Error(
          "Start date and time must be at least 5 minutes in the future."
        );
      }

      if (startDateTime > maxAllowedDateTime) {
        throw new Error(
          "Start date and time can't be more than 1 year in the future."
        );
      }

      // Create the Tournament Game using the args passed in, and associate it with the specified group.
      // You may also associate the user who is creating the game.

      const tournamentGame = await TournamentGame.create({
        name: args.name,
        gameType: "tournament",
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

      // // Create the initial table for the Cash Game
      // await Table.create({
      //   gameId: tournamentGame.gameId,
      //   gameType: "tournament",
      // });

      return tournamentGame;
    },
    deleteGame: async (parent, { gameId, gameType }, context) => {
      // Check if the user is authenticated
      if (!context.authUserId) {
        throw new GraphQLError("You must be logged in to delete a game", {
          extensions: {
            code: "UNAUTHENTICATED",
          },
        });
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
        throw new GraphQLError("You are not authorized to delete this game", {
          extensions: {
            code: "UNAUTHENTICATED",
          },
        });
      }

      // If it's a tournament game, check if its status is "waiting"
      if (gameType === "tournament" && game.status !== "waiting") {
        throw new Error(
          "Tournament game can only be deleted if its status is 'waiting'"
        );
      }

      // Find and delete all associated tables of the game
      const tables = await Table.findAll({
        where: {
          [`${gameType}Id`]: game[`${gameType}Id`],
        },
      });

      for (const table of tables) {
        await table.destroy();
      }

      // Delete the game
      await game.destroy();

      return "Game successfully deleted";
    },

    joinGame: async (parent, { gameId, gameType }, context) => {
      // Check if the user is authenticated
      if (!context.authUserId) {
        throw new GraphQLError("You must be logged in to join a game");
      }

      try {
        // Assuming that user access control is already handled to ensure
        // the user belongs to the poker group, you can proceed to check
        // game eligibility.

        let game;

        if (gameType === "cash") {
          game = await CashGame.findByPk(gameId, { include: Table });
        } else if (gameType === "tournament") {
          game = await TournamentGame.findByPk(gameId, { include: Table });
        } else {
          throw new Error("Invalid game type");
        }

        if (!game) {
          throw new Error("Game not found");
        }

        console.log("--------(joinGame)Game: ", game);

        // Check game eligibility based on game type and status
        if (
          (gameType === "cash" && game.status !== "finished") ||
          (gameType === "tournament" &&
            (game.status === "waiting" ||
              (game.status === "ongoing" &&
                !hasLateRegistrationExpired(
                  game.startDateTime,
                  game.lateRegistrationDuration
                ))))
        ) {
          console.log(
            "--------(joinGame)Game is eligible, looking for existing Player"
          );
          // Check if the user has already registered for the game
          const existingPlayer = await Player.findOne({
            where: {
              userId: context.authUserId,
              gameType: gameType,
              [`${gameType}Id`]: game[`${gameType}Id`],
            },
          });

          if (existingPlayer) {
            console.log("You have already registered for this game");
            throw new Error("You have already registered for this game");
          }

          // Find or create a table based on your criteria
          let table = await findOrCreateTable(game, gameType);
          console.log("--------(joinGame)Table: ", table);

          // Get the assigned seat numbers for the table
          const assignedSeatNumbers = table.players.map(
            (player) => player.seatNumber
          );

          // Assign the player to the table with a seat number
          const seatNumber = findAvailableSeatNumber(
            assignedSeatNumbers,
            game.playersPerTable
          );
          const newPlayer = await Player.create({
            userId: context.authUserId,
            cashId: game.cashId,
            tournamentId: game.tournamentId,
            gameType: gameType,
            tableId: table.tableId,
            seatNumber: seatNumber,
          });
          console.log("--------(joinGame)New Player: ", newPlayer);

          // After creating the player, publish the game update
          //THIS WILL LIKELY BE CHANGED TO PUBSUB??
          //ADD THIS BACK LATER!!

          const message = JSON.stringify({
            type: "gameUpdate",
            [`${gameType}Id`]: game[`${gameType}Id`],
            gameType: gameType,
            status: game.status,
            userId: context.authUserId, // Include the user ID in the payload
          });

          publishMessage(`game:${game[`${gameType}Id`]}`, message);

          return newPlayer;
        } else {
          throw new Error("You cannot join this game");
        }
      } catch (error) {
        console.error(error);
        throw new Error("Error joining the game");
      }
    },
    leaveGame: async (parent, { gameId, gameType }, context) => {
      // Check if the user is authenticated
      if (!context.authUserId) {
        throw new GraphQLError("You must be logged in to leave a game");
      }

      try {
        // Find the game based on gameId and gameType
        let game;

        if (gameType === "cash") {
          game = await CashGame.findByPk(gameId, { include: Table });
        } else if (gameType === "tournament") {
          game = await TournamentGame.findByPk(gameId, { include: Table });
        } else {
          throw new Error("Invalid game type");
        }

        if (!game) {
          throw new Error("Game not found");
        }

        // Find the player to remove from the game
        const playerToRemove = await Player.findOne({
          where: {
            userId: context.authUserId,
            gameType: gameType,
            [`${gameType}Id`]: game[`${gameType}Id`],
          },
        });

        if (!playerToRemove) {
          throw new Error("Player not found in the game");
        }

        // Get the player's data before removing them
        const playerData = {
          playerId: playerToRemove.playerId,
          userId: playerToRemove.userId,
          [`${gameType}Id`]: playerToRemove[`${playerToRemove.gameType}Id`],
          gameType: playerToRemove.gameType,
          tableId: playerToRemove.tableId,
          seatNumber: playerToRemove.seatNumber,
        };

        // Remove the player from the game
        await playerToRemove.destroy();

        // Check if the table is empty after removing the player
        const playersAtTable = await Player.count({
          where: {
            tableId: playerToRemove.tableId,
          },
        });

        if (playersAtTable === 0) {
          // If the table is empty, remove it
          const tableToRemove = await Table.findByPk(playerToRemove.tableId);
          if (tableToRemove) {
            await tableToRemove.destroy();
          }
        }

        return playerData;
      } catch (error) {
        console.error("Error while leaving the game:", error.message);
        throw new Error("Error leaving the game");
      }
    },
    updateGameStatus: async (parent, { gameId, gameType, status }, context) => {
      try {
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

        // Update the game status
        await game.update({ status: status });

        return {
          message: "Game status updated successfully",
          gameId: game.gameId,
          gameType: gameType,
          status: game.status,
        };
      } catch (error) {
        console.error(error);
        throw new Error("Failed to update game status");
      }
    },
    distributeCards: async (parent, { tableId }, context) => {
      try {
        // Retrieve necessary information from the database or cache
        const table = await Table.findByPk(tableId, { include: Player });
        const numPlayers = table.players.length;
        // const dealerSeat = table.dealerSeat;
        const dealerSeat = 1; //**** Add logic to determine dealer seat
        const occupiedSeats = table.players.map((player) => player.seatNumber);

        // Call the utility function to distribute cards
        const deck = await createShuffledDeck(); // Make sure to implement createShuffledDeck
        const handState = distributeCards(
          numPlayers,
          deck,
          dealerSeat,
          occupiedSeats
        );

        // Update seat numbers and player IDs in handState
        // Enhance PlayerHand with userId
        handState.players.forEach((player, index) => {
          player.seatNumber = occupiedSeats[index];
          player.playerId = table.players[index].playerId;
          player.userId = table.players[index].userId;
        });

        // Publish the cards data to the game channel
        await pubsub.publish(`game:${table.gameId}`, {
          watchGame: {
            [`${table.gameType}Id`]: table[`${table.gameType}Id`],
            message: "Cards distributed successfully!",
            handState,
          },
        });

        return {
          message: "Cards distributed successfully!",
          handState,
        };
      } catch (error) {
        console.error("Error distributing cards:", error);
        throw new Error("Failed to distribute cards");
      }
    },
    // This is just a test mutation that interacts with redis
    sendMessage: async (_, { content }) => {
      try {
        // Content is just the message you wish to send, published to the "message_posted" channel.
        await pubsub.publish("MESSAGE_POSTED", { newMessage: content });
        return { content }; // returns the content in the Apollo Playground just for verification of sender
      } catch (error) {
        console.error("Error publishing message:", error);
        throw new Error("Error publishing message");
      }
    },
  },
  Subscription: {
    newMessage: {
      subscribe: () => pubsub.asyncIterator(["MESSAGE_POSTED"]), // This will subscribe to the message_posted channel (Need 2 Apollo instances to test)
    },
    watchGame: {
      subscribe: (parent, { gameId }) => {
        console.log(`Client subscribed to game:${gameId}`);
        return pubsub.asyncIterator([`game:${gameId}`]);
      },
    },
  },
};

module.exports = resolvers;
