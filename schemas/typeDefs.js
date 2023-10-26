const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type User {
    userId: ID!
    name: String!
    email: String!
    chip_stack: Float!
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

  type Auth {
    token: ID!
    user: User
  }

  type Query {
    users: [User]!
    user(userId: ID!): User
  }

  type Mutation {
    addUser(name: String!, email: String!, password: String!): Auth
    login(email: String!, password: String!): Auth
    removeUser(userId: ID!): User
  }
`;

module.exports = typeDefs;
