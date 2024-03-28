const { createClient } = require("graphql-ws");
const WebSocket = require("ws");
const request = require("supertest");
const { initializeWebsocketServer } = require("../utils/testConnection");

const { makeFutureDate } = require("../utils/dateMakersTest");
const { loginUserAndGetToken } = require("../utils/testUserLogin");

// Mock the GraphQL resolvers to intercept and simulate subscription behavior
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

  // Setup before all tests run: start a WebSocket server, log in users, create a game
  beforeAll(async () => {
    ({ app, cleanup, port } = await initializeWebsocketServer());
    // Initialize a test WebSocket server
    wsClient = createClient({
      url: `ws://localhost:${port}/graphql`,
      webSocketImpl: WebSocket,
    });

    // Log in two users to obtain authentication tokens
    authToken1 = await loginUserAndGetToken(
      "user1@example.com",
      "password1",
      app
    );

    authToken2 = await loginUserAndGetToken(
      "user2@example.com", // Ensure this user is seeded in your test DB
      "password2",
      app
    );

    // Create a cash game setup using GraphQL mutation
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

    // Players join the game
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

    // This is where we join with both players
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

  // Cleanup after all tests have run
  afterAll(async () => {
    cleanup();
    wsClient.dispose();
  });
  // Test case: Validate receiving subscription data when cards are distributed
  it("should receive subscription data when cards are distributed", (done) => {
    // Setup subscription to watch a game
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
    // Flag to track if subscription completed its lifecycle
    let subscriptionCompleted = false;

    // Subscribe to game updates using the GraphQL subscription query, client we created above
    const subscription = wsClient.subscribe(
      {
        query: subscribeToWatchGame,
        variables: { gameId: cashGameId.toString(), gameType: "cash" },
      },
      {
        // Callback for receiving data updates
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

            // Inside the 'finally' block, after the mutation response
            // Check if the subscription is unsubscribed after receiving data
            expect(subscription.closed).toBe(true);

            // Check if the 'complete' callback is invoked
            expect(subscriptionCompleted).toBe(true);

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
          // Callback to set flag when subscription completes
          subscriptionCompleted = true;
        },
      }
    );

    // Set a timeout to ensure the subscription does not hang indefinitely
    const subscriptionTimeout = setTimeout(() => {
      if (!subscriptionCompleted) {
        subscription.unsubscribe();
        done(new Error("Subscription timeout"));
      }
    }, 10000);

    // Add an error variable outside the promise chain
    let errorOccurred = null;

    // Simulate triggering the card distribution logic after a delay
    setTimeout(() => {
      // Actual triggering of card distribution
      request(app)
        .post("/graphql")
        .send({
          query: `
          mutation Mutation($tableId: ID!) {
            distributeCards(tableId: $tableId) {
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
          }`,
          variables: { tableId: "1" },
        })
        .then((response) => {
          console.log("Mutation response:", response.body);
          // Expect a successful response
          expect(response.status).toBe(200);
          const data = response.body.data;
          const players = data.distributeCards.handState.players;
          const handState = data.distributeCards.handState;

          // We want players to be iterable (array)
          expect(players).toBeInstanceOf(Array);

          // Check card rank and suit for validitity, like an enum:
          const validRanks = [
            "TWO",
            "THREE",
            "FOUR",
            "FIVE",
            "SIX",
            "SEVEN",
            "EIGHT",
            "NINE",
            "TEN",
            "JACK",
            "QUEEN",
            "KING",
            "ACE",
          ];
          const validSuits = ["HEARTS", "DIAMONDS", "CLUBS", "SPADES"];

          // Function to validate a single card, we'll use this later..
          const validateCard = (card) => {
            expect(validRanks).toContain(card.rank);
            expect(validSuits).toContain(card.suit);
          };

          // Now use this function to validate all cards in handState
          expect(handState).toHaveProperty("players");

          const cardTypes = [
            "burn1",
            "flop1",
            "flop2",
            "flop3",
            "turn",
            "river",
          ];

          cardTypes.forEach((type) => {
            expect(handState).toHaveProperty(type); // This will check that the community cards have been distributed
          });

          // Iterate over the cardTypes array to access each card type from handState
          cardTypes.forEach((cardType) => {
            if (handState[cardType]) {
              // Check if the cardType exists in handState
              validateCard(handState[cardType]);
            }
          });

          // Further iterating over each players and hole cards
          handState.players.forEach((player) => {
            expect(player).toHaveProperty("playerId");
            expect(player).toHaveProperty("userId");
            expect(player).toHaveProperty("seatNumber");
            expect(player).toHaveProperty("holeCards");
            expect(player.holeCards).toBeInstanceOf(Array);
            player.holeCards.forEach((card) => {
              validateCard(card); // Assuming validateCard is defined correctly
            });
          });
        })
        .catch((error) => {
          console.error("Error triggering mutation:", error);
          errorOccurred = error; // Set the error occurred
        })
        .finally(() => {
          clearTimeout(subscriptionTimeout); // Clear the subscription timeout
          if (errorOccurred) {
            done(errorOccurred); // Call done with the error if there was one
          } else {
            done(); // Otherwise, just signal completion
          }
        });
    }, 2000); // Adjust based on actual timing needed for subscription to be ready
  });
});
