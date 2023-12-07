const { RedisPubSub } = require("graphql-redis-subscriptions");
const { Redis } = require("ioredis");

const options = {
  host: process.env.REDIS_HOST || "redis",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000);
  },
};

const pubsub = new RedisPubSub({
  publisher: new Redis(options),
  subscriber: new Redis(options),
});

const sessionStore = new Redis(options);

module.exports = { pubsub, sessionStore };
