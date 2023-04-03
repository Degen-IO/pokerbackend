const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type User {
    _id: ID
    name: String
    email: String
    password: String
    players: [Player]!
  }

  type Player {
    _id: ID!
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

    removeUser(userId: ID!): User
  }
`;

module.exports = typeDefs;
