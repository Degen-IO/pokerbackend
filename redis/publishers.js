const { redisPublisher } = require("../config/redis");
/*
This file defines a utility function for publishing messages to Redis channels. 
This can be expanded to include multiple functions, each handling different aspects of game state publishing. 
This file will essentially become a central point for all Redis publish operations related to the game.

Possible publishers:
- Player actions
- Hand Results, after a hand concludes who won, what was the winning hand?
- Player connectivity? Disconnected? 
- Other game states....


The subscribers will listen to these updates and react accordingly, such as updating the client-side state or triggering further actions.
*/
function publishMessage(channel, message) {
  redisPublisher.publish(channel, message);
}

module.exports = { publishMessage };
