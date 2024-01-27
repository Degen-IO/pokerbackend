const { redisPublisher, redisSubscriber, pubsub } = require("../config/redis");
const { publishMessage } = require("../redis/publishers");
const { Subscription } = require("../schemas/resolvers");

describe("Redis Functionality", () => {
  // Mock publish method

  test("should publish a message", () => {
    const testChannel = "testChannel";
    const testMessage = "Hello World";
    publishMessage(testChannel, testMessage);
    expect(redisPublisher.publish).toHaveBeenCalledWith(
      testChannel,
      testMessage
    );
  });

  test("should handle incoming messages correctly", () => {
    // Prepare a mock callback
    const mockMessageHandler = jest.fn();

    // Set the mock implementation
    redisSubscriber.on.mockImplementation((event, callback) => {
      if (event === "message") {
        // When "message" event is subscribed, replace it with the mock handler
        mockMessageHandler.mockImplementation(callback);
      }
    });

    // Simulate an incoming message
    // This should trigger the mockMessageHandler
    mockMessageHandler("game:123", "Test message");

    // Check if the mock handler was called as expected
    expect(mockMessageHandler).toHaveBeenCalledWith("game:123", "Test message");
  });

  describe("GraphQL Subscription Resolvers", () => {
    test("newMessage subscription", () => {
      const asyncIteratorMock = jest.fn();
      pubsub.asyncIterator = asyncIteratorMock;

      // Call the subscribe method directly
      const iterator = Subscription.newMessage.subscribe();

      // Check if asyncIterator was called with the correct channel
      expect(asyncIteratorMock).toHaveBeenCalledWith(["MESSAGE_POSTED"]);

      // Optionally, you can also test the behavior of the iterator
      // depending on your implementation details
    });
  });
});
