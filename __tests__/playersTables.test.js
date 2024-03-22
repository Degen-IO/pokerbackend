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
    - Tests that a games staus can be changed
    - Tests that a finsihed game cannot be joined
  
*/

describe("joinGame, leaveGame, updateGameStatus operations", () => {
  let app, server, sequelize;
  let authToken1;
  let authToken2;
  let authToken3;
  let authToken4;
  let authToken5;
  let cashGameId;
  let tournamentGameId;
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
          cashId
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
    cashGameId = createCashGameResponse.body.data.createCashGame.cashId;

    const createTournamentGameQuery = `
  mutation CreateTournamentGame($groupId: ID!, $name: String!, $startDateTime: String!, $playersPerTable: Int!, $numberOfRebuys: Int!, $rebuyPeriod: RebuyPeriod!, $addOn: Boolean!, $startingChips: Float!, $gameSpeed: GameSpeed!, $lateRegistrationDuration: LateRegistrationDuration!) {
  createTournamentGame(groupId: $groupId, name: $name, startDateTime: $startDateTime, playersPerTable: $playersPerTable, numberOfRebuys: $numberOfRebuys, rebuyPeriod: $rebuyPeriod, addOn: $addOn, startingChips: $startingChips, gameSpeed: $gameSpeed, lateRegistrationDuration: $lateRegistrationDuration) {
    tournamentId
    status
    name
  }
}
`;

    const createTournamentGameVariables = {
      groupId: "3",
      name: "TournamentGameTest",
      startDateTime: makeFutureDate(),
      playersPerTable: 2,
      startingChips: 10000,
      numberOfRebuys: 1,
      rebuyPeriod: "_30min",
      addOn: true,
      gameSpeed: "fast",
      lateRegistrationDuration: "_60min",
    };

    const createTournamentGameResponse = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken2}`)
      .send({
        query: createTournamentGameQuery,
        variables: createTournamentGameVariables,
      });

    // Check if the tournament game was created successfully
    if (
      createTournamentGameResponse.statusCode !== 200 ||
      !createTournamentGameResponse.body.data.createTournamentGame
    ) {
      throw new Error("Failed to create the tournament game for testing.");
    }

    // Assign the tournament game ID to a variable
    tournamentGameId =
      createTournamentGameResponse.body.data.createTournamentGame.tournamentId;
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
          cashId
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
    expect(joinGame.playerId).toBe("1");
    expect(joinGame).toHaveProperty("userId");
    expect(joinGame).toHaveProperty("cashId");
    expect(joinGame.cashId).toBe("1");
    expect(joinGame).toHaveProperty("gameType");
    expect(joinGame).toHaveProperty("tableId");
    expect(joinGame.tableId).toBe("1");
    expect(joinGame).toHaveProperty("seatNumber");
    expect(joinGame.seatNumber).toBe(1);

    initialTableId = joinGame.tableId;
  });

  it("allows User2 to join the cash game and get the 2nd seat at the initial table", async () => {
    const joinGameQuery = `
      mutation JoinGame($gameId: ID!, $gameType: GameType!) {
        joinGame(gameId: $gameId, gameType: $gameType) {
          playerId
          userId
          cashId
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
    expect(joinGame).toHaveProperty("cashId");
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
          cashId
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
    expect(joinGame).toHaveProperty("cashId");
    expect(joinGame).toHaveProperty("gameType");
    expect(joinGame).toHaveProperty("tableId");
    expect(joinGame).toHaveProperty("seatNumber");

    // Additional assertions specific to this scenario
    expect(joinGame.seatNumber).toBe(1);
    expect(joinGame.tableId).toBe("2");
    expect(joinGame.tableId).not.toEqual(initialTableId); // Ensure a new table is created

    tableTwoId = joinGame.tableId;
  });

  it("allows User4 to join the cash game and get the 2nd seat at the 2nd table", async () => {
    const joinGameQuery = `
      mutation JoinGame($gameId: ID!, $gameType: GameType!) {
        joinGame(gameId: $gameId, gameType: $gameType) {
          playerId
          userId
          cashId
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
    expect(joinGame).toHaveProperty("cashId");
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
          cashId
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
    expect(joinGame).toHaveProperty("cashId");
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
      leaveGame(gameId: $gameId, gameType: $gameType) {
        playerId
        userId
        cashId
        gameType
        tableId
        seatNumber
      }
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
    expect(leaveGame.playerId).toBe("5");
    expect(leaveGame.userId).toBe("5");
    expect(leaveGame.cashId).toBe("1");
    expect(leaveGame.gameType).toBe("cash");
    expect(leaveGame.tableId).toBe("3");
    expect(leaveGame.seatNumber).toBe(1);

    // Check for the existance of User5Player and user5Table. They should be null
    if (leaveGame.playerId && leaveGame.tableId) {
      const playerInstance = await Player.findByPk(leaveGame.playerId);
      const tableInstance = await Table.findByPk(leaveGame.tableId);

      expect(playerInstance).toBeNull();
      expect(tableInstance).toBeNull();
    }
  });

  it("allows User2 to leave the cash game and User5 to join, getting an empty seat at initial table", async () => {
    //User2 leaves game
    const leaveGameQuery = `
    mutation LeaveGame($gameId: ID!, $gameType: GameType!) {
      leaveGame(gameId: $gameId, gameType: $gameType) {
        playerId
        userId
        cashId
        gameType
        tableId
        seatNumber
      }
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
          cashId
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
    expect(joinGame.seatNumber).toBe(2);
  });

  it("allows User2 to join the tournament game", async () => {
    // User1 joins the tournament game
    const joinGameQuery = `
      mutation JoinGame($gameId: ID!, $gameType: GameType!) {
        joinGame(gameId: $gameId, gameType: $gameType) {
          playerId
          userId
          tournamentId
          gameType
          tableId
          seatNumber
        }
      }
    `;

    const joinGameVariables = {
      gameId: tournamentGameId,
      gameType: "tournament",
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
    // Check if the returned data has the expected structure

    const { joinGame } = joinGameResponse.body.data;
    expect(joinGame.tableId).toBe("4");
    expect(joinGame.seatNumber).toBe(1);
  });
  it("allows User1 to join the tournament game", async () => {
    // User1 joins the tournament game
    const joinGameQuery = `
      mutation JoinGame($gameId: ID!, $gameType: GameType!) {
        joinGame(gameId: $gameId, gameType: $gameType) {
          playerId
          userId
          tournamentId
          gameType
          tableId
          seatNumber
        }
      }
    `;

    const joinGameVariables = {
      gameId: tournamentGameId,
      gameType: "tournament",
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
    expect(joinGame.tableId).toBe("4");
    expect(joinGame.seatNumber).toBe(2);
  });
  it("allows User3 to join the tournament game", async () => {
    // User1 joins the tournament game
    const joinGameQuery = `
      mutation JoinGame($gameId: ID!, $gameType: GameType!) {
        joinGame(gameId: $gameId, gameType: $gameType) {
          playerId
          userId
          tournamentId
          gameType
          tableId
          seatNumber
        }
      }
    `;

    const joinGameVariables = {
      gameId: tournamentGameId,
      gameType: "tournament",
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
    // Check if the returned data has the expected structure

    const { joinGame } = joinGameResponse.body.data;
    expect(joinGame.tableId).toBe("5");
    expect(joinGame.seatNumber).toBe(1);
  });
  it("allows User3 to leave the tournament game, and checks that they are still a part of the cash game", async () => {
    const leaveGameQuery = `
      mutation LeaveGame($gameId: ID!, $gameType: GameType!) {
        leaveGame(gameId: $gameId, gameType: $gameType) {
          playerId
          userId
          tournamentId
          gameType
          tableId
          seatNumber
        }
      }
    `;

    const leaveGameVariables = {
      gameId: tournamentGameId,
      gameType: "tournament",
    };

    const leaveGameResponse = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken3}`)
      .send({
        query: leaveGameQuery,
        variables: leaveGameVariables,
      });
    expect(leaveGameResponse.statusCode).toBe(200);
    expect(leaveGameResponse.body).toHaveProperty("data");
    expect(leaveGameResponse.body.data).toHaveProperty("leaveGame");

    const { leaveGame } = leaveGameResponse.body.data;
    expect(leaveGame.playerId).toBe("9");
    expect(leaveGame.tournamentId).toBe("1");
    expect(leaveGame.gameType).toBe("tournament");

    // Check for the existance of Player9 and user3. They should be null
    if (leaveGame.playerId && leaveGame.tableId) {
      const playerInstance = await Player.findByPk(leaveGame.playerId);
      const tableInstance = await Table.findByPk(leaveGame.tableId);

      expect(playerInstance).toBeNull();
      expect(tableInstance).toBeNull();
    }

    //Check that User3 is still a Player in the cash game
    const playerInstance = await Player.findByPk("3");
    expect(playerInstance).not.toBeNull();
  });

  it("changes the status of a game to 'finished'", async () => {
    const updateGameStatusQuery = `
      mutation UpdateGameStatus($gameId: ID!, $gameType: GameType!, $status: GameStatus!) {
        updateGameStatus(gameId: $gameId, gameType: $gameType, status: $status) {
          message
          cashId
          gameType
          status
        }
      }
    `;

    // Variables for updating the game status
    const updateGameStatusVariables = {
      gameId: cashGameId,
      gameType: "cash",
      status: "finished",
    };

    // Execute the mutation to update the game status
    const updateGameStatusResponse = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken1}`) // Use admin token or another user with the necessary permissions
      .send({
        query: updateGameStatusQuery,
        variables: updateGameStatusVariables,
      });

    // Ensure the mutation response is as expected
    const { updateGameStatus } = updateGameStatusResponse.body.data;

    expect(updateGameStatus.message).toBe("Game status updated successfully");
    expect(updateGameStatus.cashId).toBe(cashGameId);
    expect(updateGameStatus.gameType).toBe("cash");
    expect(updateGameStatus.status).toBe("finished");
  });

  it("fails to allow a user to join a finished game", async () => {
    const joinGameQuery = `
      mutation JoinGame($gameId: ID!, $gameType: GameType!) {
        joinGame(gameId: $gameId, gameType: $gameType) {
          playerId
          userId
          cashId
          gameType
          tableId
          seatNumber
        }
      }
    `;

    // Variables for joining the game
    const joinGameVariables = {
      gameId: cashGameId,
      gameType: "cash",
    };

    // Execute the mutation to join the game
    const joinGameResponse = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken2}`)
      .send({
        query: joinGameQuery,
        variables: joinGameVariables,
      });

    // Ensure the mutation fails as expected
    const { joinGame } = joinGameResponse.body.data;
    expect(joinGame).toBeNull(); // or check for specific error message in response
  });
});
