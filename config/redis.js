// config/redis.js
const { RedisPubSub } = require("graphql-redis-subscriptions");
const { Redis } = require("ioredis");
const { PubSub } = require("graphql-subscriptions");

let redisClient, redisPublisher, redisSubscriber, pubsub, sessionStore;

try {
  if (process.env.NODE_ENV === "test") {
    // Use in-memory PubSub for tests
    pubsub = new PubSub();
    console.log("Initialized in-memory PubSub for testing.");
  } else {
    const options = {
      host: process.env.REDIS_HOST || "redis",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      retryStrategy: (times) => Math.min(times * 50, 2000),
    };

    redisClient = new Redis(options);
    redisPublisher = new Redis(options);
    redisSubscriber = new Redis(options);

    pubsub = new RedisPubSub({
      publisher: redisPublisher,
      subscriber: redisSubscriber,
    });

    sessionStore = redisClient;
    console.log("Redis clients initialized successfully.");
  }
} catch (error) {
  console.error("Error initializing Redis clients:", error);
}

module.exports = {
  pubsub,
  sessionStore,
  redisClient,
  redisPublisher,
  redisSubscriber,
  closeRedisConnections: async function () {
    if (redisClient) await redisClient.quit();
    if (redisPublisher) await redisPublisher.quit();
    if (redisSubscriber) await redisSubscriber.quit();
  },
};
