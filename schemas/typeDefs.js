const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type User {
    id: ID
    name: String
    email: String
    players: [Player]!
  }

  type Player {
    id: ID
    name: String!
    chips: Int!
    isDealer: Boolean!
    isSmallBlind: Boolean!
    isBigBlind: Boolean!
    hand: [String!]!
    isActive: Boolean!
    isAllIn: Boolean!
    lastBet: Int!
    betAmount: Int!
    user: User! # add this field to reference the user who owns the player
  }

  type Game {
    id: ID!
    name: String!
    status: GameStatus!
    players: [Player!]!
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

  type Auth {
    token: ID!
    user: User
  }

  type Query {
    users: [User]!
    user(userId: ID!): User
    players: [Player]!
    player(playerId: ID!): Player
  }

  type Mutation {
    addUser(name: String!, email: String!, password: String!): Auth
    login(email: String!, password: String!): Auth
    removeUser(_id: ID!): User
  }
`;

module.exports = typeDefs;
