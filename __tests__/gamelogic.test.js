const { redisPublisher, redisSubscriber, pubsub } = require("../config/redis");
const { publishMessage } = require("../redis/publishers");
const { Subscription } = require("../schemas/resolvers");

const request = require("supertest");
const { initializeServer } = require("../utils/testConnection");
const {
  makeBadFutureDate,
  makeFutureDate,
  makePastDate,
} = require("../utils/dateMakersTest");
const { loginUserAndGetToken } = require("../utils/testUserLogin");

describe("It should create a game and deal cards", () => {
  let app, server, sequelize;
  let authToken; // Admin
  let authToken2;
  let cashGameId;
  let tableId;

  const mockPublish = jest.fn();
  redisPublisher.publish = mockPublish;
  beforeAll(async () => {
    ({ app, server, sequelize } = await initializeServer());
    redisPublisher.publish = mockPublish;

    authToken = await loginUserAndGetToken(
      "user1@example.com",
      "password1",
      app
    );
    authToken2 = await loginUserAndGetToken(
      "user2@example.com",
      "password2",
      app
    );
  });

  afterAll(async () => {
    mockPublish.mockReset();

    await sequelize.close();
  });

  it("creates a cash game", async () => {
    const query = `
    mutation CreateCashGame($groupId: ID!, $name: String!, $startDateTime: String!, $playersPerTable: Int!, $startingChips: Float!, $blindsSmall: Float!, $blindsBig: Float!, $duration: Duration!) {
        createCashGame(groupId: $groupId, name: $name, startDateTime: $startDateTime, playersPerTable: $playersPerTable, startingChips: $startingChips, blindsSmall: $blindsSmall, blindsBig: $blindsBig, duration: $duration) {
          gameId
          name
          status
          startDateTime
          playersPerTable
          startingChips
          blindsSmall
          blindsBig
          duration
        }
      }
        `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`) //  Logged in user1
      .send({
        query,
        variables: {
          groupId: "1",
          name: "CashTest1",
          startDateTime: makeFutureDate(),
          playersPerTable: 8,
          startingChips: 5000,
          blindsSmall: 25,
          blindsBig: 50,
          duration: "_3hr",
        },
      });
    // Assign the cash game ID to the variable
    cashGameId = response.body.data.createCashGame.gameId;
    expect(response.statusCode).toBe(200);
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
      .set("Authorization", `Bearer ${authToken}`)
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
    tableId = joinGameResponse.body.data.joinGame.tableId;
    expect(joinGame).toHaveProperty("playerId");
    expect(joinGame).toHaveProperty("userId");
    expect(joinGame).toHaveProperty("gameId");
    expect(joinGame).toHaveProperty("gameType");
    expect(joinGame).toHaveProperty("tableId");
    expect(joinGame).toHaveProperty("seatNumber");

    expect(joinGame.tableId).toBe(initialTableId);
    expect(joinGame.seatNumber).toBe(2);
  });

  it("distributes cards to user1 and user2", async () => {
    const query = `
        mutation CreateCashGame($tableId: ID!) {
            distributeCards(tableId: $tableId) {
              handState {
                players {
                  playerId
                  userId
                  seatNumber
                  holeCards {
                    rank
                    suit
                  }
                }
                burn1 {
                  rank
                  suit
                }
                flop1 {
                  rank
                  suit
                }
                flop2 {
                  rank
                  suit
                }
                flop3 {
                  rank
                  suit
                }
                burn2 {
                  rank
                  suit
                }
                turn {
                  rank
                  suit
                }
                burn3 {
                  rank
                  suit
                }
                river {
                  rank
                  suit
                }
              }
            }
          }
          `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`) //  Logged in user1
      .send({
        query,
        variables: {
          tableId,
        },
      });

    // TO DO -- check to see if the message was published
    expect(response.body.data.distributeCards).toHaveProperty("handState");
    expect(response.body.data.distributeCards.handState.players.length == 2);
    expect(response.body.data.distributeCards.handState).toHaveProperty(
      "burn1"
    );
    expect(response.body.data.distributeCards.handState).toHaveProperty(
      "flop1"
    );
    expect(response.body.data.distributeCards.handState).toHaveProperty(
      "flop2"
    );
    expect(response.body.data.distributeCards.handState).toHaveProperty(
      "flop3"
    );
    expect(response.body.data.distributeCards.handState).toHaveProperty(
      "burn2"
    );
    expect(response.body.data.distributeCards.handState).toHaveProperty("turn");
    expect(response.body.data.distributeCards.handState).toHaveProperty(
      "burn3"
    );
    expect(response.body.data.distributeCards.handState).toHaveProperty(
      "river"
    );
  });
});
