// redis/subscribers.js
const { redisSubscriber } = require("../config/redis");

if (!redisSubscriber) {
  console.error("redisSubscriber is undefined. Check Redis configuration.");
  process.exit(1); // Exit the process if redisSubscriber is unavailable
} else {
  // Subscribe to channels
  redisSubscriber.subscribe("game:*", (err, count) => {
    if (err) {
      console.error("Failed to subscribe to game channel:", err.message);
    } else {
      console.log("Subscribed to game channel successfully!");
    }
  });

  redisSubscriber.subscribe("testChannel", (err, count) => {
    if (err) {
      console.error("Failed to subscribe to testChannel:", err.message);
    } else {
      console.log(
        `Subscribed to testChannel. Currently subscribed to ${count} channels.`
      );
    }
  });

  redisSubscriber.on("message", (channel, message) => {
    console.log(`Received message from ${channel}: ${message}`);
    // Handle different types of messages here
  });
}
