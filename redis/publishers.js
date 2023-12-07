const { redisPublisher } = require("../config/redis");

function publishMessage(channel, message) {
  redisPublisher.publish(channel, message);
}

module.exports = { publishMessage };
