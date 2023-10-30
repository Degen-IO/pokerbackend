const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type User {
    userId: ID!
    name: String!
    email: String!
    chip_stack: Float!
  }

  type PokerGroup {
    groupId: ID!
    name: String!
    admin: User
    pendingMembers: [User]
  }

  type Game {
    gameId: ID!
    name: String!
    status: GameStatus!
    deck: Deck!
  }

  enum GameStatus {
    IN_PROGRESS
    FINISHED
  }

  type Card {
    rank: Rank!
    suit: Suit!
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

  type Deck {
    id: ID!
    cards: [Card!]!
  }

  type UserUpdateResponse {
    message: String!
    user: User
  }

  type Auth {
    token: ID!
    user: User
  }

  type Query {
    users: [User]!
    user(userId: ID!): User
    pokerGroups(userId: ID!): [PokerGroup]
    pendingMembers(groupId: ID!): [User]
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

    createPokerGroup(name: String!): PokerGroup
    deletePokerGroup(groupId: ID!): String

    requestToJoinGroup(groupId: ID!): PokerGroup
  }
`;

module.exports = typeDefs;
