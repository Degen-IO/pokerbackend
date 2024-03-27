const { createClient } = require("graphql-ws");
const WebSocket = require("ws");
const request = require("supertest");
const { initializeWebsocketServer } = require("../utils/testConnection");
const { Player, Table } = require("../models");

const { makeFutureDate } = require("../utils/dateMakersTest");
const { loginUserAndGetToken } = require("../utils/testUserLogin");

jest.mock("../schemas/resolvers", () => {
  const { PubSub } = require("graphql-subscriptions");
  const originalModule = jest.requireActual("../schemas/resolvers");
  const mockPubsub = new PubSub();
  return {
    ...originalModule,
    Subscription: {
      ...originalModule.Subscription,
      watchGame: {
        subscribe: (_, { gameId, gameType }) => {
          console.log(`Mock client subscribed to ${gameType}:${gameId}`);
          return mockPubsub.asyncIterator([`${gameType}:${gameId}`]);
        },
      },
    },
  };
});

describe("Subscription Tests", () => {
  let wsClient, app, cleanup, port;
  let authToken1, authToken2, cashGameId;

  beforeAll(async () => {
    ({ app, cleanup, port } = await initializeWebsocketServer());
    wsClient = createClient({
      url: `ws://localhost:${port}/graphql`,
      webSocketImpl: WebSocket,
    });

    // User 1 = Admin (simulate login and obtain token)
    authToken1 = await loginUserAndGetToken(
      "user1@example.com", // Ensure this user is seeded in your test DB
      "password1",
      app
    );

    authToken2 = await loginUserAndGetToken(
      "user2@example.com", // Ensure this user is seeded in your test DB
      "password2",
      app
    );

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
      groupId: "1",
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

    cashGameId = createCashGameResponse.body.data.createCashGame.cashId;

    //   Now players must join
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

    const joinGameResponse1 = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken1}`)
      .send({
        query: joinGameQuery,
        variables: joinGameVariables,
      });

    const joinGameResponse2 = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken2}`)
      .send({
        query: joinGameQuery,
        variables: joinGameVariables,
      });
  });

  afterAll(async () => {
    cleanup();
    wsClient.dispose();
  });

  it("should receive subscription data when cards are distributed", (done) => {
    const subscribeToWatchGame = `
      subscription Subscription($gameId: ID!, $gameType: GameType!) {
        watchGame(gameId: $gameId, gameType: $gameType) {
          gameId
          message
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
      }`;

    let subscriptionCompleted = false;

    const subscription = wsClient.subscribe(
      {
        query: subscribeToWatchGame,
        variables: { gameId: cashGameId.toString(), gameType: "cash" },
      },
      {
        next: (data) => {
          console.log("Received data from subscription:", data);
          try {
            expect(data.data).not.toBeNull();
            expect(data.data.watchGame).toHaveProperty(
              "gameId",
              cashGameId.toString()
            );
            expect(data.data.watchGame).toHaveProperty(
              "message",
              "Cards distributed successfully!"
            );
            expect(
              data.data.watchGame.handState.players.length
            ).toBeGreaterThan(0);

            // Check if player with ID 1 is included in the response
            const player1Included = data.data.watchGame.handState.players.some(
              (player) => player.playerId === "1"
            );
            expect(player1Included).toBe(true);

            // Check if player with ID 2 is included in the response
            const player2Included = data.data.watchGame.handState.players.some(
              (player) => player.playerId === "2"
            );
            expect(player2Included).toBe(true);
          } catch (error) {
            done(error);
          }
        },
        error: (err) => {
          console.error("Error from subscription:", err);
          done(err);
        },
        complete: () => {
          subscriptionCompleted = true;
        },
      }
    );

    // Wait for subscription to complete or timeout after 10 seconds
    const subscriptionTimeout = setTimeout(() => {
      if (!subscriptionCompleted) {
        subscription.unsubscribe();
        done(new Error("Subscription timeout"));
      }
    }, 10000);

    // Trigger card distribution mutation after 2 seconds
    setTimeout(() => {
      console.log("Triggering card distribution mutation");
      request(app)
        .post("/graphql")
        .send({
          query: `
            mutation DistributeCards($tableId: ID!) {
              distributeCards(tableId: $tableId) {
                message
                handState {
                  players {
                    playerId
                  }
                }
              }
            }`,
          variables: { tableId: "1" }, // Ensure this matches actual data
        })
        .then((response) => {
          console.log("Mutation response:", response.body);
          // Check if the HTTP status code is 200 (OK)
          expect(response.status).toBe(200);
          // Optionally check other properties of the response body
        })
        .catch((error) => {
          console.error("Error triggering mutation:", error);
          done(error);
        })
        .finally(() => {
          clearTimeout(subscriptionTimeout); // Clear the subscription timeout
          done(); // Signal test completion
        });
    }, 2000); // Adjust based on actual timing needed for subscription to be ready
  });
});
