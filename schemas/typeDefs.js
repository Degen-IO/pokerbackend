const { gql } = require("graphql-tag");

const typeDefs = gql`
  type User {
    userId: ID!
    name: String!
    email: String!
    chip_stack: Float!
  }

  type Player {
    playerId: ID!
    userId: ID!
    gameId: ID!
    gameType: String!
    tableId: ID!
    seatNumber: Int
  }

  type Table {
    tableId: ID!
    gameId: ID!
    dealerSeat: Int
  }

  type PokerGroup {
    groupId: ID!
    name: String!
    joinPassword: String!
  }

  type CashGame {
    gameId: ID!
    name: String!
    status: GameStatus!
    startDateTime: String!
    playersPerTable: Int!
    startingChips: Float!
    blindsSmall: Float!
    blindsBig: Float!
    duration: Duration!
  }

  type TournamentGame {
    gameId: ID!
    name: String!
    status: GameStatus!
    startDateTime: String!
    playersPerTable: Int!
    numberOfRebuys: Int!
    rebuyPeriod: RebuyPeriod!
    addOn: Boolean!
    startingChips: Float!
    gameSpeed: GameSpeed!
    lateRegistrationDuration: LateRegistrationDuration!
  }

  type Card {
    rank: Rank!
    suit: Suit!
  }

  type Deck {
    id: ID!
    cards: [Card!]!
  }

  type UserUpdateResponse {
    message: String!
    user: User
  }

  type GameStatusUpdateResponse {
    message: String!
    gameId: ID!
    gameType: GameType!
    status: GameStatus!
  }

  type GameUpdatePayload {
    gameId: ID!
    message: String!
    handState: HandState
  }

  type DistributeCardsResponse {
    message: String!
    handState: HandState
  }

  type HandState {
    players: [PlayerHand]
    burn1: Card
    flop1: Card
    flop2: Card
    flop3: Card
    burn2: Card
    turn: Card
    burn3: Card
    river: Card
  }

  type PlayerHand {
    playerId: ID
    userId: ID
    seatNumber: Int
    holeCards: [Card]
  }

  type Auth {
    token: ID!
    user: User
  }

  enum GameStatus {
    waiting
    ongoing
    finished
  }

  enum GameType {
    cash
    tournament
  }
  enum RebuyPeriod {
    _30min
    _60min
    _90min
    _120min
    none
  }

  enum GameSpeed {
    slow
    medium
    fast
    ridiculous
  }

  enum Duration {
    _1hr
    _2hr
    _3hr
    _4hr
    unlimited
    manual
  }

  enum LateRegistrationDuration {
    _30min
    _60min
    _90min
    none
  }

  enum Rank {
    TWO
    THREE
    FOUR
    FIVE
    SIX
    SEVEN
    EIGHT
    NINE
    TEN
    JACK
    QUEEN
    KING
    ACE
  }

  enum Suit {
    CLUBS
    DIAMONDS
    HEARTS
    SPADES
  }

  type Message {
    content: String!
  }

  type Query {
    users: [User]!
    user(userId: ID!): User
    pokerGroups(userId: ID!): [PokerGroup]
    pendingMembers(groupId: ID!): [User]
    membersOfGroup(groupId: ID!): [User]
    cashGamesInGroup(groupId: ID!): [CashGame!]!
    tournamentGamesInGroup(groupId: ID!): [TournamentGame!]!
  }

  type Mutation {
    addUser(name: String!, email: String!, password: String!): Auth
    login(email: String!, password: String!): Auth
    updateUser(
      userId: ID!
      name: String
      email: String
      password: String
    ): UserUpdateResponse
    removeUser(userId: ID!): UserUpdateResponse

    createPokerGroup(name: String!, joinPassword: String!): PokerGroup
    deletePokerGroup(groupId: ID!): String

    requestToJoinGroup(groupId: ID!, joinPassword: String!): PokerGroup
    approvePendingMember(groupId: ID!, userId: ID!): PokerGroup
    removeGroupMember(groupId: ID!, userId: ID!): String

    createCashGame(
      groupId: ID!
      name: String!
      startDateTime: String!
      playersPerTable: Int!
      startingChips: Float!
      blindsSmall: Float!
      blindsBig: Float!
      duration: Duration!
    ): CashGame

    createTournamentGame(
      groupId: ID!
      name: String!
      startDateTime: String!
      playersPerTable: Int!
      numberOfRebuys: Int!
      rebuyPeriod: RebuyPeriod!
      addOn: Boolean!
      startingChips: Float!
      gameSpeed: GameSpeed!
      lateRegistrationDuration: LateRegistrationDuration!
    ): TournamentGame

    deleteGame(gameId: ID!, gameType: GameType!): String

    joinGame(gameId: ID!, gameType: GameType!): Player

    leaveGame(gameId: ID!, gameType: GameType!): String

    updateGameStatus(
      gameId: ID!
      gameType: GameType!
      status: GameStatus!
    ): GameStatusUpdateResponse

    distributeCards(tableId: ID!): DistributeCardsResponse

    sendMessage(content: String!): Message
  }

  type Subscription {
    newMessage: String
    watchGame(gameId: ID!): GameUpdatePayload
  }
`;

module.exports = typeDefs;
