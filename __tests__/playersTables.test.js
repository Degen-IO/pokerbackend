const request = require("supertest");
const { initializeServer } = require("../utils/testConnection");
const {
  makeBadFutureDate,
  makeFutureDate,
  makePastDate,
} = require("../utils/dateMakersTest");
const { loginUserAndGetToken } = require("../utils/testUserLogin");
/*
    These are the tests for joinGame and leaveGame mutations involving the creation of Players and Tables 
    
    Includes:
  
*/

describe("joinGame leaveGame operations", () => {
  let app, server, sequelize;
  let authToken1;
  let authToken2;
  let authToken3;
  let authToken4;
  let authToken5;

  let cashGameId; // Variable to store the cash game ID

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
  it("allows a user to join a cash game", async () => {
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
      .set("Authorization", `Bearer ${authToken2}`)
      .send({
        query: joinGameQuery,
        variables: joinGameVariables,
      });

    expect(joinGameResponse.statusCode).toBe(200);
  });
});
