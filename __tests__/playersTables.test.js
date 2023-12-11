const request = require("supertest");
const { initializeServer } = require("../utils/testConnection");
const { Player, Table } = require("../models");

const { makeFutureDate } = require("../utils/dateMakersTest");
const { loginUserAndGetToken } = require("../utils/testUserLogin");
/*
    These are the tests for joinGame and leaveGame mutations involving the creation of Players and Tables 
    
    Includes:
    - Tests for Player and Table create and destroy 
    - Tests that an empty seat is filled before trying to create new table
  
*/

describe("joinGame leaveGame operations", () => {
  let app, server, sequelize;
  let authToken1;
  let authToken2;
  let authToken3;
  let authToken4;
  let authToken5;
  let cashGameId;
  //use to check if Player and Table are destroyed correctly
  let user5PlayerId;
  let user5TableId;
  //store this table ID to check that User5 is sat at this table once the seat has been made empty from User2 leaving the game
  let initialTableId;
  let tableTwoId;

  beforeAll(async () => {
    ({ app, server, sequelize } = await initializeServer());
    // User 1 = Admin of Group 3
    authToken1 = await loginUserAndGetToken(
      "user1@example.com",
      "password1",
      app
    );
    // Group 3 members
    authToken2 = await loginUserAndGetToken(
      "user2@example.com",
      "password2",
      app
    );

    authToken3 = await loginUserAndGetToken(
      "user3@example.com",
      "password3",
      app
    );

    authToken4 = await loginUserAndGetToken(
      "user4@example.com",
      "password4",
      app
    );
    authToken5 = await loginUserAndGetToken(
      "user5@example.com",
      "password5",
      app
    );

    // Create a cash game in Group 3 using User 1's credentials
    const createCashGameQuery = `
      mutation CreateCashGame($groupId: ID!, $name: String!, $startDateTime: String!, $playersPerTable: Int!, $startingChips: Float!, $blindsSmall: Float!, $blindsBig: Float!, $duration: Duration!) {
        createCashGame(groupId: $groupId, name: $name, startDateTime: $startDateTime, playersPerTable: $playersPerTable, startingChips: $startingChips, blindsSmall: $blindsSmall, blindsBig: $blindsBig, duration: $duration) {
          gameId
          status
          name
        }
      }
    `;

    const createCashGameVariables = {
      groupId: "3",
      name: "CashGameTest",
      startDateTime: makeFutureDate(),
      playersPerTable: 2,
      startingChips: 5000,
      blindsSmall: 25,
      blindsBig: 50,
      duration: "_3hr",
    };

    const createCashGameResponse = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken1}`)
      .send({
        query: createCashGameQuery,
        variables: createCashGameVariables,
      });

    // Check if the cash game was created successfully
    if (
      createCashGameResponse.statusCode !== 200 ||
      !createCashGameResponse.body.data.createCashGame
    ) {
      throw new Error("Failed to create the cash game for testing.");
    }

    // Assign the cash game ID to the variable
    cashGameId = createCashGameResponse.body.data.createCashGame.gameId;
  });

  afterAll(async () => {
    await sequelize.close();
  });
  it("allows User1 to join a cash game", async () => {
    const joinGameQuery = `
      mutation Mutation($gameId: ID!, $gameType: GameType!) {
        joinGame(gameId: $gameId, gameType: $gameType) {
          playerId
          userId
          gameId
          gameType
          tableId
          seatNumber
        }
      }
    `;

    const joinGameVariables = {
      gameId: cashGameId, // Use the cash game ID from the variable
      gameType: "cash",
    };

    const joinGameResponse = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken1}`)
      .send({
        query: joinGameQuery,
        variables: joinGameVariables,
      });

    expect(joinGameResponse.statusCode).toBe(200);
    expect(joinGameResponse.body).toHaveProperty("data");
    expect(joinGameResponse.body.data).toHaveProperty("joinGame");
    // Check if the returned data has the expected structure
    const { joinGame } = joinGameResponse.body.data;
    expect(joinGame).toHaveProperty("playerId");
    expect(joinGame).toHaveProperty("userId");
    expect(joinGame).toHaveProperty("gameId");
    expect(joinGame).toHaveProperty("gameType");
    expect(joinGame).toHaveProperty("tableId");
    expect(joinGame).toHaveProperty("seatNumber");

    initialTableId = joinGame.tableId;
  });

  it("allows User2 to join the cash game and get the 2nd seat at the initial table", async () => {
    const joinGameQuery = `
      mutation JoinGame($gameId: ID!, $gameType: GameType!) {
        joinGame(gameId: $gameId, gameType: $gameType) {
          playerId
          userId
          gameId
          gameType
          tableId
          seatNumber
        }
      }
    `;

    const joinGameVariables = {
      gameId: cashGameId,
      gameType: "cash",
    };

    const joinGameResponse = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken2}`)
      .send({
        query: joinGameQuery,
        variables: joinGameVariables,
      });

    expect(joinGameResponse.statusCode).toBe(200);
    expect(joinGameResponse.body).toHaveProperty("data");
    expect(joinGameResponse.body.data).toHaveProperty("joinGame");

    const { joinGame } = joinGameResponse.body.data;
    expect(joinGame).toHaveProperty("playerId");
    expect(joinGame).toHaveProperty("userId");
    expect(joinGame).toHaveProperty("gameId");
    expect(joinGame).toHaveProperty("gameType");
    expect(joinGame).toHaveProperty("tableId");
    expect(joinGame).toHaveProperty("seatNumber");

    expect(joinGame.tableId).toBe(initialTableId);
    expect(joinGame.seatNumber).toBe(2);
  });

  it("allows User3 to join the cash game and get the 1st seat at the 2nd table", async () => {
    const joinGameQuery = `
      mutation JoinGame($gameId: ID!, $gameType: GameType!) {
        joinGame(gameId: $gameId, gameType: $gameType) {
          playerId
          userId
          gameId
          gameType
          tableId
          seatNumber
        }
      }
    `;

    const joinGameVariables = {
      gameId: cashGameId,
      gameType: "cash",
    };

    const joinGameResponse = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken3}`)
      .send({
        query: joinGameQuery,
        variables: joinGameVariables,
      });

    expect(joinGameResponse.statusCode).toBe(200);
    expect(joinGameResponse.body).toHaveProperty("data");
    expect(joinGameResponse.body.data).toHaveProperty("joinGame");

    const { joinGame } = joinGameResponse.body.data;
    expect(joinGame).toHaveProperty("playerId");
    expect(joinGame).toHaveProperty("userId");
    expect(joinGame).toHaveProperty("gameId");
    expect(joinGame).toHaveProperty("gameType");
    expect(joinGame).toHaveProperty("tableId");
    expect(joinGame).toHaveProperty("seatNumber");

    // Additional assertions specific to this scenario
    expect(joinGame.seatNumber).toBe(1);
    expect(joinGame.tableId).not.toEqual(initialTableId); // Ensure a new table is created

    tableTwoId = joinGame.tableId;
  });

  it("allows User4 to join the cash game and get the 2nd seat at the 2nd table", async () => {
    const joinGameQuery = `
      mutation JoinGame($gameId: ID!, $gameType: GameType!) {
        joinGame(gameId: $gameId, gameType: $gameType) {
          playerId
          userId
          gameId
          gameType
          tableId
          seatNumber
        }
      }
    `;

    const joinGameVariables = {
      gameId: cashGameId,
      gameType: "cash",
    };

    const joinGameResponse = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken4}`)
      .send({
        query: joinGameQuery,
        variables: joinGameVariables,
      });

    expect(joinGameResponse.statusCode).toBe(200);
    expect(joinGameResponse.body).toHaveProperty("data");
    expect(joinGameResponse.body.data).toHaveProperty("joinGame");

    const { joinGame } = joinGameResponse.body.data;
    expect(joinGame).toHaveProperty("playerId");
    expect(joinGame).toHaveProperty("userId");
    expect(joinGame).toHaveProperty("gameId");
    expect(joinGame).toHaveProperty("gameType");
    expect(joinGame).toHaveProperty("tableId");
    expect(joinGame).toHaveProperty("seatNumber");

    // Additional assertions specific to this scenario
    expect(joinGame.seatNumber).toBe(2);
    expect(joinGame.tableId).toBe(tableTwoId);
  });

  it("allows User5 to join the cash game and get the 1st seat at the 3rd table", async () => {
    const joinGameQuery = `
      mutation JoinGame($gameId: ID!, $gameType: GameType!) {
        joinGame(gameId: $gameId, gameType: $gameType) {
          playerId
          userId
          gameId
          gameType
          tableId
          seatNumber
        }
      }
    `;

    const joinGameVariables = {
      gameId: cashGameId,
      gameType: "cash",
    };

    const joinGameResponse = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken5}`)
      .send({
        query: joinGameQuery,
        variables: joinGameVariables,
      });

    expect(joinGameResponse.statusCode).toBe(200);
    expect(joinGameResponse.body).toHaveProperty("data");
    expect(joinGameResponse.body.data).toHaveProperty("joinGame");

    const { joinGame } = joinGameResponse.body.data;
    expect(joinGame).toHaveProperty("playerId");
    expect(joinGame).toHaveProperty("userId");
    expect(joinGame).toHaveProperty("gameId");
    expect(joinGame).toHaveProperty("gameType");
    expect(joinGame).toHaveProperty("tableId");
    expect(joinGame).toHaveProperty("seatNumber");

    // Additional assertions specific to this scenario
    expect(joinGame.seatNumber).toBe(1);
    expect(joinGame.tableId).not.toBeNull(); // Ensure a new table is created

    //set these variables to see if Player and Table are destroyed when User5 leaves the 3rd table
    user5PlayerId = joinGame.playerId;
    user5TableId = joinGame.tableId;
  });

  it("allows User5 to leave the cash game, destroying associated Player and table", async () => {
    const leaveGameQuery = `
      mutation LeaveGame($gameId: ID!, $gameType: GameType!) {
        leaveGame(gameId: $gameId, gameType: $gameType)
      }
    `;

    const leaveGameVariables = {
      gameId: cashGameId,
      gameType: "cash",
    };

    const leaveGameResponse = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken5}`)
      .send({
        query: leaveGameQuery,
        variables: leaveGameVariables,
      });

    expect(leaveGameResponse.statusCode).toBe(200);
    expect(leaveGameResponse.body).toHaveProperty("data");
    expect(leaveGameResponse.body.data).toHaveProperty("leaveGame");

    const { leaveGame } = leaveGameResponse.body.data;
    expect(leaveGame).toBe("Successfully left the game");

    // Check for the existance of User5Player and user5Table. They should be null
    if (user5PlayerId && user5TableId) {
      const playerInstance = await Player.findByPk(user5PlayerId);
      const tableInstance = await Table.findByPk(user5TableId);

      expect(playerInstance).toBeNull();
      expect(tableInstance).toBeNull();
    }
  });

  it("allows User2 to leave the cash game and User5 to join, getting an empty seat at initial table", async () => {
    //User2 leaves game
    const leaveGameQuery = `
      mutation LeaveGame($gameId: ID!, $gameType: GameType!) {
        leaveGame(gameId: $gameId, gameType: $gameType)
      }
    `;

    const leaveGameVariables = {
      gameId: cashGameId,
      gameType: "cash",
    };

    const leaveGameResponse = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken2}`)
      .send({
        query: leaveGameQuery,
        variables: leaveGameVariables,
      });

    //User5 re-joins game
    const joinGameQuery = `
      mutation JoinGame($gameId: ID!, $gameType: GameType!) {
        joinGame(gameId: $gameId, gameType: $gameType) {
          playerId
          userId
          gameId
          gameType
          tableId
          seatNumber
        }
      }
    `;

    const joinGameVariables = {
      gameId: cashGameId,
      gameType: "cash",
    };

    const joinGameResponse = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken5}`)
      .send({
        query: joinGameQuery,
        variables: joinGameVariables,
      });
    const { joinGame } = joinGameResponse.body.data;
    expect(joinGame.tableId).toBe(initialTableId);
  });
});
