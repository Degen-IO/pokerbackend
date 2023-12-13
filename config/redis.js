// In your config/redis.js
const { RedisPubSub } = require("graphql-redis-subscriptions");
const { Redis } = require("ioredis");

let redisClient, redisPublisher, redisSubscriber, pubsub, sessionStore;

// Same setup as sequelize connection, TO DO: setup redis testing instance
if (process.env.NODE_ENV !== "test") {
  const options = {
    host: process.env.REDIS_HOST || "redis",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    retryStrategy: (times) => {
      return Math.min(times * 50, 2000);
    },
  };

  // General Redis client for commands
  redisClient = new Redis(options);

  // Dedicated Redis client for publishing
  redisPublisher = new Redis(options);

  // Dedicated Redis client for subscribing
  redisSubscriber = new Redis(options);

  // Setup for Redis PubSub (for GraphQL subscriptions)
  pubsub = new RedisPubSub({
    publisher: redisPublisher,
    subscriber: redisSubscriber,
  });

  // Using the general client for session store
  sessionStore = redisClient;
}
module.exports = {
  pubsub,
  sessionStore,
  redisClient,
  redisPublisher,
  redisSubscriber,
  // This may be used for tests in the future...?
  closeRedisConnections: async function () {
    await redisClient.quit();
    await redisPublisher.quit();
    await redisSubscriber.quit();
  },
};
