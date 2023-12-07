// In your config/redis.js
const { RedisPubSub } = require("graphql-redis-subscriptions");
const { Redis } = require("ioredis");

const options = {
  host: process.env.REDIS_HOST || "redis",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000);
  },
};

// General Redis client for commands
const redisClient = new Redis(options);

// Dedicated Redis client for publishing
const redisPublisher = new Redis(options);

// Dedicated Redis client for subscribing
const redisSubscriber = new Redis(options);

// Setup for Redis PubSub (for GraphQL subscriptions)
const pubsub = new RedisPubSub({
  publisher: redisPublisher,
  subscriber: redisSubscriber,
});

// Using the general client for session store
const sessionStore = redisClient;

module.exports = {
  pubsub,
  sessionStore,
  redisClient,
  redisPublisher,
  redisSubscriber,
};
