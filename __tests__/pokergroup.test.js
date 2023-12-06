const request = require("supertest");
const { initializeServer } = require("../utils/testConnection");
const {
  makeBadFutureDate,
  makeFutureDate,
  makePastDate,
} = require("../utils/dateMakersTest");
const { loginUserAndGetToken } = require("../utils/testUserLogin");
/*
    These are the tests for poker group functionality. 
    
    Includes:
    - Queries for fetching poker groups,
    - Requesting to join a group,
    - Fetching pendingMembers for admins (and denying access for non-admins)
    - Group Member Removal (Admins can remove members, members can't remove members, admins cant remove themselves)
    - Cash Game Creation (and error handling of bad cases such as late or too future game, min/max, etc)
    - Tournamanet Game Creation (and error handling of bad cases)
*/

describe("PokerGroup CRUD Operations", () => {
  let app, server, sequelize;
  let authToken; // Admin
  let authToken2; // Non member, Non Admin (but will be and then be removed)
  let authToken3; // Member, non admin
  let authToken4; // Non member, Not admin

  beforeAll(async () => {
    ({ app, server, sequelize } = await initializeServer());
    // User 1 = Admin in Group 1
    authToken = await loginUserAndGetToken(
      "user1@example.com",
      "password1",
      app
    );
    // User 2 = Not an Admin, nor in Group 1, will be added
    authToken2 = await loginUserAndGetToken(
      "user5@example.com",
      "password5",
      app
    );
    // User 3 = Not an admin, but a member in Group 1
    authToken3 = await loginUserAndGetToken(
      "user2@example.com",
      "password2",
      app
    );
    // User 3 = Not an admin, but a member in Group 1
    authToken4 = await loginUserAndGetToken(
      "user4@example.com",
      "password4",
      app
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // Example Test for Fetching Poker Groups
  it("fetches poker groups for a user", async () => {
    const query = `
        query Query($userId: ID!) {
            pokerGroups(userId: $userId) {
            groupId
            joinPassword
            name
            }
        }
    `;

    const response = await request(app)
      .post("/graphql")
      .send({
        query,
        variables: {
          userId: "1",
        },
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveProperty("pokerGroups");
    // Further assertions based on your seeded test data
  });
  it("requests user5 to join user1 group", async () => {
    const query = `
        mutation Mutation($groupId: ID!, $joinPassword: String!) {
            requestToJoinGroup(groupId: $groupId, joinPassword: $joinPassword) {
              groupId
              joinPassword
              name
            }
          }
    `;

    const groupId = "1";
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken2}`)
      .send({
        query,
        variables: {
          groupId,
          joinPassword: "password1",
        },
      });
    expect(response.body.data.requestToJoinGroup.groupId === "1");
  });
  //Test for fetching pending members as an admin
  it("fetches pending members for a group as an admin, should be userId 5 is the only pending member ", async () => {
    const query = `
        query Query($groupId: ID!) {
            pendingMembers(groupId: $groupId) {
            chip_stack
            email
            name
            userId
            }
        }
          `;

    const groupId = "1";

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`) // Set the auth token if needed
      .send({
        query,
        variables: {
          groupId,
        },
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveProperty("pendingMembers");
    expect(response.body.data.pendingMembers.length == 1);
    expect(response.body.data.pendingMembers[0].userId === "5");
  });
  // Test for unauthorized access to pending members
  it("denies access to non-admin users", async () => {
    const query = `
            query PendingMembers($groupId: ID!) {
              pendingMembers(groupId: $groupId) {
                userId
                name
                email
              }
            }
          `;

    const groupId = "1";

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken2}`) // not an admin
      .send({
        query,
        variables: {
          groupId,
        },
      });
    expect(response.statusCode).toBe(200); // GraphQL often returns 200 even for errors
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors[0].message).toContain("not authorized");
  });
  // Group Approval
  it("denies group approval access to non-admins", async () => {
    const query = `
        mutation Mutation($groupId: ID!, $userId: ID!) {
            approvePendingMember(groupId: $groupId, userId: $userId) {
            groupId
            joinPassword
            name
            }
        }
      `;

    const groupId = "1";
    const userId = "5";

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken3}`) // Not an admin
      .send({
        query,
        variables: {
          groupId,
          userId,
        },
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors[0].message).toContain("not authorized");
  });
  it("allows admins to approve pending members to a group", async () => {
    const query = `
        mutation Mutation($groupId: ID!, $userId: ID!) {
            approvePendingMember(groupId: $groupId, userId: $userId) {
            groupId
            joinPassword
            name
            }
        }
      `;

    const groupId = "1";
    const userId = "5";

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`) //  Proper admin
      .send({
        query,
        variables: {
          groupId,
          userId,
        },
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.data.approvePendingMember);
  });
  // Removing Users
  it("denies access to non-admins attempting to remove a user from a group", async () => {
    const query = `
        mutation Mutation($groupId: ID!, $userId: ID!) {
            removeGroupMember(groupId: $groupId, userId: $userId)
        }
      `;

    const groupId = "1";
    const userId = "5";

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken3}`) //  Not an admin, just a member
      .send({
        query,
        variables: {
          groupId,
          userId,
        },
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors[0].message).toContain("not authorized");
  });
  it("allows admins to remove a user from a group", async () => {
    const query = `
        mutation Mutation($groupId: ID!, $userId: ID!) {
            removeGroupMember(groupId: $groupId, userId: $userId)
        }
      `;

    const groupId = "1";
    const userId = "5";

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`) //  Proper admin
      .send({
        query,
        variables: {
          groupId,
          userId,
        },
      });
    expect(response.body.data).toHaveProperty("removeGroupMember");
    expect(response.body.data.removeGroupMember).toContain(
      "successfully removed"
    );
  });
  it("denies admins ability to remove themselves from a group", async () => {
    const query = `
        mutation Mutation($groupId: ID!, $userId: ID!) {
            removeGroupMember(groupId: $groupId, userId: $userId)
        }
      `;

    const groupId = "1";
    const userId = "1";

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`) //  Proper admin
      .send({
        query,
        variables: {
          groupId,
          userId,
        },
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.data).toHaveProperty("removeGroupMember");
    expect(response.body.errors[0].message).toContain(
      "An admin cannot remove themselves"
    );
  });
  it("allows a user to remove themselves from a group", async () => {
    const query = `
        mutation Mutation($groupId: ID!, $userId: ID!) {
            removeGroupMember(groupId: $groupId, userId: $userId)
        }
      `;

    const groupId = "2";
    const userId = "1"; // self removal of user 1

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        query,
        variables: {
          groupId,
          userId,
        },
      });
    expect(response.body.data).toHaveProperty("removeGroupMember");
    expect(response.body.data.removeGroupMember).toContain(
      "successfully removed"
    );
  });
  // Group Creation
  it("denies group creation to users who arent logged in", async () => {
    const query = `
        mutation Mutation($name: String!, $joinPassword: String!) {
            createPokerGroup(name: $name, joinPassword: $joinPassword) {
            groupId
            joinPassword
            name
            }
        }
      `;

    const name = "testGroup";
    const joinPassword = "testPassword";

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", null) //  Not logged in
      .send({
        query,
        variables: {
          name,
          joinPassword,
        },
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors[0].message).toContain("must be logged in");
  });
  it("allows group creation if logged in", async () => {
    const query = `
        mutation Mutation($name: String!, $joinPassword: String!) {
            createPokerGroup(name: $name, joinPassword: $joinPassword) {
            groupId
            joinPassword
            name
            }
        }
      `;

    const name = "testGroup";
    const joinPassword = "testPassword";

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken2}`) //  Logged in user5
      .send({
        query,
        variables: {
          name,
          joinPassword,
        },
      });
    expect(response.statusCode).toBe(200); // GraphQL often returns 200 even for errors
    expect(response.body).toHaveProperty("data");
    expect(response.body.data.createPokerGroup.id === "3");
  });
  // Creating Cash Games
  it("creates a cash game", async () => {
    const query = `
        mutation CreateCashGame($groupId: ID!, $name: String!, $startDateTime: String!, $playersPerTable: Int!, $startingChips: Float!, $blindsSmall: Float!, $blindsBig: Float!, $duration: Duration!) {
            createCashGame(groupId: $groupId, name: $name, startDateTime: $startDateTime, playersPerTable: $playersPerTable, startingChips: $startingChips, blindsSmall: $blindsSmall, blindsBig: $blindsBig, duration: $duration) {
              blindsBig
              blindsSmall
              duration
              gameId
              name
              playersPerTable
              startingChips
              startDateTime
              status
            }
          }
        `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`) //  Logged in user5
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
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data.createCashGame.status == "waiting");
  });
  it("fails to create a cash game with less than 2 players per table", async () => {
    const query = `
        mutation CreateCashGame($groupId: ID!, $name: String!, $startDateTime: String!, $playersPerTable: Int!, $startingChips: Float!, $blindsSmall: Float!, $blindsBig: Float!, $duration: Duration!) {
            createCashGame(groupId: $groupId, name: $name, startDateTime: $startDateTime, playersPerTable: $playersPerTable, startingChips: $startingChips, blindsSmall: $blindsSmall, blindsBig: $blindsBig, duration: $duration) {
              blindsBig
              blindsSmall
              duration
              gameId
              name
              playersPerTable
              startingChips
              startDateTime
              status
            }
          }
        `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`) //  Logged in user5
      .send({
        query,
        variables: {
          groupId: "1",
          name: "CashTest1",
          startDateTime: makeFutureDate(),
          playersPerTable: 1,
          startingChips: 5000,
          blindsSmall: 25,
          blindsBig: 50,
          duration: "_3hr",
        },
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors[0].message).toContain(
      "Validation min on playersPerTable failed"
    );
  });
  it("fails to create a cash game with greater than 10 players per table", async () => {
    const query = `
        mutation CreateCashGame($groupId: ID!, $name: String!, $startDateTime: String!, $playersPerTable: Int!, $startingChips: Float!, $blindsSmall: Float!, $blindsBig: Float!, $duration: Duration!) {
            createCashGame(groupId: $groupId, name: $name, startDateTime: $startDateTime, playersPerTable: $playersPerTable, startingChips: $startingChips, blindsSmall: $blindsSmall, blindsBig: $blindsBig, duration: $duration) {
              blindsBig
              blindsSmall
              duration
              gameId
              name
              playersPerTable
              startingChips
              startDateTime
              status
            }
          }
        `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`) //  Logged in user5
      .send({
        query,
        variables: {
          groupId: "1",
          name: "CashTest1",
          startDateTime: makeFutureDate(),
          playersPerTable: 12,
          startingChips: 5000,
          blindsSmall: 25,
          blindsBig: 50,
          duration: "_3hr",
        },
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors[0].message).toContain(
      "Validation max on playersPerTable failed"
    );
  });
  it("creates a cash game without admin access", async () => {
    const query = `
        mutation CreateCashGame($groupId: ID!, $name: String!, $startDateTime: String!, $playersPerTable: Int!, $startingChips: Float!, $blindsSmall: Float!, $blindsBig: Float!, $duration: Duration!) {
            createCashGame(groupId: $groupId, name: $name, startDateTime: $startDateTime, playersPerTable: $playersPerTable, startingChips: $startingChips, blindsSmall: $blindsSmall, blindsBig: $blindsBig, duration: $duration) {
              blindsBig
              blindsSmall
              duration
              gameId
              name
              playersPerTable
              startingChips
              startDateTime
              status
            }
          }
        `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken3}`) //  Logged in user5
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
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data.createCashGame.status == "waiting");
  });
  it("fails to create a cash game without member access", async () => {
    const query = `
        mutation CreateCashGame($groupId: ID!, $name: String!, $startDateTime: String!, $playersPerTable: Int!, $startingChips: Float!, $blindsSmall: Float!, $blindsBig: Float!, $duration: Duration!) {
            createCashGame(groupId: $groupId, name: $name, startDateTime: $startDateTime, playersPerTable: $playersPerTable, startingChips: $startingChips, blindsSmall: $blindsSmall, blindsBig: $blindsBig, duration: $duration) {
              blindsBig
              blindsSmall
              duration
              gameId
              name
              playersPerTable
              startingChips
              startDateTime
              status
            }
          }
        `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken4}`) //  Logged in user5
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
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors[0].message).toContain(
      "not authorized to create a game in this group"
    );
  });
  it("fails to create a cash game that isn't >=5 min in the future", async () => {
    const query = `
        mutation CreateCashGame($groupId: ID!, $name: String!, $startDateTime: String!, $playersPerTable: Int!, $startingChips: Float!, $blindsSmall: Float!, $blindsBig: Float!, $duration: Duration!) {
            createCashGame(groupId: $groupId, name: $name, startDateTime: $startDateTime, playersPerTable: $playersPerTable, startingChips: $startingChips, blindsSmall: $blindsSmall, blindsBig: $blindsBig, duration: $duration) {
              blindsBig
              blindsSmall
              duration
              gameId
              name
              playersPerTable
              startingChips
              startDateTime
              status
            }
          }
        `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`) //  Logged in user5
      .send({
        query,
        variables: {
          groupId: "1",
          name: "CashTest2",
          startDateTime: makePastDate(),
          playersPerTable: 8,
          startingChips: 5000,
          blindsSmall: 25,
          blindsBig: 50,
          duration: "_3hr",
        },
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors[0].message).toContain(
      "must be at least 5 minutes in the future"
    );
  });
  it("fails to create a cash game thats too far in the future (+1 years)", async () => {
    const query = `
        mutation CreateCashGame($groupId: ID!, $name: String!, $startDateTime: String!, $playersPerTable: Int!, $startingChips: Float!, $blindsSmall: Float!, $blindsBig: Float!, $duration: Duration!) {
            createCashGame(groupId: $groupId, name: $name, startDateTime: $startDateTime, playersPerTable: $playersPerTable, startingChips: $startingChips, blindsSmall: $blindsSmall, blindsBig: $blindsBig, duration: $duration) {
              blindsBig
              blindsSmall
              duration
              gameId
              name
              playersPerTable
              startingChips
              startDateTime
              status
            }
          }
        `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`) //  Logged in user5
      .send({
        query,
        variables: {
          groupId: "1",
          name: "CashTest2",
          startDateTime: makeBadFutureDate(),
          playersPerTable: 8,
          startingChips: 5000,
          blindsSmall: 25,
          blindsBig: 50,
          duration: "_3hr",
        },
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors[0].message).toContain(
      "can't be more than 1 year in the future"
    );
  });
  // Query Cash Games
  it("fails to query cash games if not authorized", async () => {
    const query = `
    query Query($groupId: ID!) {
        cashGamesInGroup(groupId: $groupId) {
          blindsBig
          blindsSmall
          duration
          gameId
          name
          playersPerTable
          startDateTime
          startingChips
          status
        }
      }
    `;

    const groupId = "1";
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken4}`) //  Logged in user5
      .send({
        query,
        variables: {
          groupId,
        },
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors[0].message).toContain(
      "not authorized to view Cash Games in this group"
    );
  });
  it("queries cash games if authorized", async () => {
    const query = `
    query Query($groupId: ID!) {
        cashGamesInGroup(groupId: $groupId) {
          blindsBig
          blindsSmall
          duration
          gameId
          name
          playersPerTable
          startDateTime
          startingChips
          status
        }
      }
    `;

    const groupId = "1";
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`) //  Logged in user5
      .send({
        query,
        variables: {
          groupId,
        },
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveProperty("cashGamesInGroup");
    expect(response.body.data.cashGamesInGroup.length);
  });
  // Creating Tournaments
  it("creates a tournament game", async () => {
    const query = `
    mutation CreateTournamentGame($playersPerTable: Int!, $numberOfRebuys: Int!, $rebuyPeriod: RebuyPeriod!, $addOn: Boolean!, $startingChips: Float!, $gameSpeed: GameSpeed!, $lateRegistrationDuration: LateRegistrationDuration!, $startDateTime: String!, $name: String!, $groupId: ID!) {
        createTournamentGame(playersPerTable: $playersPerTable, numberOfRebuys: $numberOfRebuys, rebuyPeriod: $rebuyPeriod, addOn: $addOn, startingChips: $startingChips, gameSpeed: $gameSpeed, lateRegistrationDuration: $lateRegistrationDuration, startDateTime: $startDateTime, name: $name, groupId: $groupId) {
          addOn
          gameId
          gameSpeed
          lateRegistrationDuration
          name
          numberOfRebuys
          playersPerTable
          rebuyPeriod
          startDateTime
          startingChips
          status
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
          name: "TournamentTest1",
          startDateTime: makeFutureDate(),
          playersPerTable: 8,
          startingChips: 5000,
          numberOfRebuys: 2,
          rebuyPeriod: "_30min",
          addOn: true,
          gameSpeed: "slow",
          lateRegistrationDuration: "_90min",
        },
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data.createTournamentGame.status == "waiting");
  });
  it("creates a tournament game without admin access", async () => {
    const query = `
    mutation CreateTournamentGame($playersPerTable: Int!, $numberOfRebuys: Int!, $rebuyPeriod: RebuyPeriod!, $addOn: Boolean!, $startingChips: Float!, $gameSpeed: GameSpeed!, $lateRegistrationDuration: LateRegistrationDuration!, $startDateTime: String!, $name: String!, $groupId: ID!) {
        createTournamentGame(playersPerTable: $playersPerTable, numberOfRebuys: $numberOfRebuys, rebuyPeriod: $rebuyPeriod, addOn: $addOn, startingChips: $startingChips, gameSpeed: $gameSpeed, lateRegistrationDuration: $lateRegistrationDuration, startDateTime: $startDateTime, name: $name, groupId: $groupId) {
          addOn
          gameId
          gameSpeed
          lateRegistrationDuration
          name
          numberOfRebuys
          playersPerTable
          rebuyPeriod
          startDateTime
          startingChips
          status
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken3}`) //  Logged in user5
      .send({
        query,
        variables: {
          groupId: "1",
          name: "TournamentTest1",
          startDateTime: makeFutureDate(),
          playersPerTable: 8,
          startingChips: 5000,
          numberOfRebuys: 2,
          rebuyPeriod: "_30min",
          addOn: true,
          gameSpeed: "slow",
          lateRegistrationDuration: "_90min",
        },
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data.createTournamentGame.status == "waiting");
  });
  it("fails to create a tournament game without member access", async () => {
    const query = `
    mutation CreateTournamentGame($playersPerTable: Int!, $numberOfRebuys: Int!, $rebuyPeriod: RebuyPeriod!, $addOn: Boolean!, $startingChips: Float!, $gameSpeed: GameSpeed!, $lateRegistrationDuration: LateRegistrationDuration!, $startDateTime: String!, $name: String!, $groupId: ID!) {
        createTournamentGame(playersPerTable: $playersPerTable, numberOfRebuys: $numberOfRebuys, rebuyPeriod: $rebuyPeriod, addOn: $addOn, startingChips: $startingChips, gameSpeed: $gameSpeed, lateRegistrationDuration: $lateRegistrationDuration, startDateTime: $startDateTime, name: $name, groupId: $groupId) {
          addOn
          gameId
          gameSpeed
          lateRegistrationDuration
          name
          numberOfRebuys
          playersPerTable
          rebuyPeriod
          startDateTime
          startingChips
          status
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken4}`) //  Logged in user5
      .send({
        query,
        variables: {
          groupId: "1",
          name: "TournamentTest1",
          startDateTime: makeFutureDate(),
          playersPerTable: 8,
          startingChips: 5000,
          numberOfRebuys: 2,
          rebuyPeriod: "_30min",
          addOn: true,
          gameSpeed: "slow",
          lateRegistrationDuration: "_90min",
        },
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors[0].message).toContain(
      "not authorized to create a game in this group"
    );
  });
  it("fails to create a tournament game with <2 players per table", async () => {
    const query = `
        mutation CreateTournamentGame($playersPerTable: Int!, $numberOfRebuys: Int!, $rebuyPeriod: RebuyPeriod!, $addOn: Boolean!, $startingChips: Float!, $gameSpeed: GameSpeed!, $lateRegistrationDuration: LateRegistrationDuration!, $startDateTime: String!, $name: String!, $groupId: ID!) {
            createTournamentGame(playersPerTable: $playersPerTable, numberOfRebuys: $numberOfRebuys, rebuyPeriod: $rebuyPeriod, addOn: $addOn, startingChips: $startingChips, gameSpeed: $gameSpeed, lateRegistrationDuration: $lateRegistrationDuration, startDateTime: $startDateTime, name: $name, groupId: $groupId) {
            addOn
            gameId
            gameSpeed
            lateRegistrationDuration
            name
            numberOfRebuys
            playersPerTable
            rebuyPeriod
            startDateTime
            startingChips
            status
            }
        }
    `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`) //  Logged in user5
      .send({
        query,
        variables: {
          groupId: "1",
          name: "TournamentTest1",
          startDateTime: makeFutureDate(),
          playersPerTable: 1,
          startingChips: 5000,
          numberOfRebuys: 2,
          rebuyPeriod: "_30min",
          addOn: true,
          gameSpeed: "slow",
          lateRegistrationDuration: "_90min",
        },
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors[0].message).toContain(
      "Validation min on playersPerTable failed"
    );
  });
  it("fails to create a tournament game with >10 players per table", async () => {
    const query = `
        mutation CreateTournamentGame($playersPerTable: Int!, $numberOfRebuys: Int!, $rebuyPeriod: RebuyPeriod!, $addOn: Boolean!, $startingChips: Float!, $gameSpeed: GameSpeed!, $lateRegistrationDuration: LateRegistrationDuration!, $startDateTime: String!, $name: String!, $groupId: ID!) {
            createTournamentGame(playersPerTable: $playersPerTable, numberOfRebuys: $numberOfRebuys, rebuyPeriod: $rebuyPeriod, addOn: $addOn, startingChips: $startingChips, gameSpeed: $gameSpeed, lateRegistrationDuration: $lateRegistrationDuration, startDateTime: $startDateTime, name: $name, groupId: $groupId) {
            addOn
            gameId
            gameSpeed
            lateRegistrationDuration
            name
            numberOfRebuys
            playersPerTable
            rebuyPeriod
            startDateTime
            startingChips
            status
            }
        }
    `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`) //  Logged in user5
      .send({
        query,
        variables: {
          groupId: "1",
          name: "TournamentTest1",
          startDateTime: makeFutureDate(),
          playersPerTable: 11,
          startingChips: 5000,
          numberOfRebuys: 2,
          rebuyPeriod: "_30min",
          addOn: true,
          gameSpeed: "slow",
          lateRegistrationDuration: "_90min",
        },
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors[0].message).toContain(
      "Validation max on playersPerTable failed"
    );
  });
  it("fails to create a tournament game that isn't >=5 min in the future", async () => {
    const query = `
        mutation CreateTournamentGame($playersPerTable: Int!, $numberOfRebuys: Int!, $rebuyPeriod: RebuyPeriod!, $addOn: Boolean!, $startingChips: Float!, $gameSpeed: GameSpeed!, $lateRegistrationDuration: LateRegistrationDuration!, $startDateTime: String!, $name: String!, $groupId: ID!) {
            createTournamentGame(playersPerTable: $playersPerTable, numberOfRebuys: $numberOfRebuys, rebuyPeriod: $rebuyPeriod, addOn: $addOn, startingChips: $startingChips, gameSpeed: $gameSpeed, lateRegistrationDuration: $lateRegistrationDuration, startDateTime: $startDateTime, name: $name, groupId: $groupId) {
            addOn
            gameId
            gameSpeed
            lateRegistrationDuration
            name
            numberOfRebuys
            playersPerTable
            rebuyPeriod
            startDateTime
            startingChips
            status
            }
        }
    `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        query,
        variables: {
          groupId: "1",
          name: "TournamentTest1",
          startDateTime: makePastDate(),
          playersPerTable: 11,
          startingChips: 5000,
          numberOfRebuys: 2,
          rebuyPeriod: "_30min",
          addOn: true,
          gameSpeed: "slow",
          lateRegistrationDuration: "_90min",
        },
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors[0].message).toContain(
      "must be at least 5 minutes in the future"
    );
  });
  it("fails to create a tournament game thats too far in the future (+1 years)", async () => {
    const query = `
        mutation CreateTournamentGame($playersPerTable: Int!, $numberOfRebuys: Int!, $rebuyPeriod: RebuyPeriod!, $addOn: Boolean!, $startingChips: Float!, $gameSpeed: GameSpeed!, $lateRegistrationDuration: LateRegistrationDuration!, $startDateTime: String!, $name: String!, $groupId: ID!) {
            createTournamentGame(playersPerTable: $playersPerTable, numberOfRebuys: $numberOfRebuys, rebuyPeriod: $rebuyPeriod, addOn: $addOn, startingChips: $startingChips, gameSpeed: $gameSpeed, lateRegistrationDuration: $lateRegistrationDuration, startDateTime: $startDateTime, name: $name, groupId: $groupId) {
            addOn
            gameId
            gameSpeed
            lateRegistrationDuration
            name
            numberOfRebuys
            playersPerTable
            rebuyPeriod
            startDateTime
            startingChips
            status
            }
        }
    `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        query,
        variables: {
          groupId: "1",
          name: "TournamentTest1",
          startDateTime: makeBadFutureDate(),
          playersPerTable: 11,
          startingChips: 5000,
          numberOfRebuys: 2,
          rebuyPeriod: "_30min",
          addOn: true,
          gameSpeed: "slow",
          lateRegistrationDuration: "_90min",
        },
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors[0].message).toContain(
      "can't be more than 1 year in the future"
    );
  });
  // Query Tournament Games
  it("fails to query tournament games if not authorized", async () => {
    const query = `
    query Query($groupId: ID!) {
        tournamentGamesInGroup(groupId: $groupId) {
          addOn
          gameId
          gameSpeed
          lateRegistrationDuration
          numberOfRebuys
          name
          rebuyPeriod
          playersPerTable
          startDateTime
          startingChips
          status
        }
      }
    `;

    const groupId = "1";
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken4}`) //  Logged in user5
      .send({
        query,
        variables: {
          groupId,
        },
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors[0].message).toContain(
      "not authorized to view Tournament Games in this group"
    );
  });
  it("queries tournament games if authorized", async () => {
    const query = `
    query Query($groupId: ID!) {
        tournamentGamesInGroup(groupId: $groupId) {
          addOn
          gameId
          gameSpeed
          lateRegistrationDuration
          numberOfRebuys
          name
          rebuyPeriod
          playersPerTable
          startDateTime
          startingChips
          status
        }
      }
    `;

    const groupId = "1";
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`) //  Logged in user5
      .send({
        query,
        variables: {
          groupId,
        },
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveProperty("tournamentGamesInGroup");
    expect(response.body.data.tournamentGamesInGroup.length);
  });
  // Group Deletion
  it("fails to delete a pokergroup if not admin", async () => {
    const query = `
        mutation Mutation($groupId: ID!) {
            deletePokerGroup(groupId: $groupId)
        }
        `;

    const groupId = "1";

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken4}`)
      .send({
        query,
        variables: {
          groupId,
        },
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors[0].message).toContain(
      "not authorized to delete this group"
    );
  });
  it("deletes a pokergroup if admin", async () => {
    const query = `
        mutation Mutation($groupId: ID!) {
            deletePokerGroup(groupId: $groupId)
        }
        `;

    const groupId = "1";

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        query,
        variables: {
          groupId,
        },
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.data.deletePokerGroup).toContain(
      "Group successfully deleted"
    );
  });
  // Additional tests below...
});
