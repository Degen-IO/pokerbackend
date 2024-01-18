const { redisSubscriber } = require("../config/redis");
/*
This file is responsible for listening to various Redis channels related to the game and responding to messages published on those channels.

When a message is received on any of these channels, the subscriber can perform appropriate actions based on the message content. 
This could involve updating the backend game state, notifying other players, or triggering other game logic. */

// Subscribe to the global game channel
redisSubscriber.subscribe("game:*", (err, count) => {
  if (err) {
    console.error("Failed to subscribe to game channel: %s", err.message);
  } else {
    console.log(`Subscribed to game channel successfully!`);
  }
});

redisSubscriber.on("message", (channel, message) => {
  console.log(`Received message from ${channel}: ${message}`);
  // Handle different types of messages (e.g., CARD_DISTRIBUTION)
  // Update the backend game state, notify other players, or trigger game logic
});

//Allows the server to react in real-time to actions and changes in the game, maintaining an up-to-date and synchronized state across all participants.

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
