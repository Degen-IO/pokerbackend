const { redisSubscriber } = require("../config/redis");

redisSubscriber.subscribe("testChannel", (err, count) => {
  if (err) {
    console.error("Failed to subscribe: %s", err.message);
  } else {
    console.log(
      `Subscribed successfully! This client is currently subscribed to ${count} channels.`
    );
  }
});

redisSubscriber.on("message", (channel, message) => {
  console.log(`Received message from ${channel}: ${message}`);
});
