jest.mock("../config/redis", () => {
  const redisMock = require("redis-mock");

  const mockPublisher = redisMock.createClient();
  mockPublisher.publish = jest.fn(); // Mock the publish method

  const mockSubscriber = redisMock.createClient();
  mockSubscriber.subscribe = jest.fn();
  mockSubscriber.on = jest.fn();

  const mockPubSub = {
    asyncIterator: jest.fn().mockImplementation(() => ({
      // ... implementation
    })),
    publish: mockPublisher.publish, // Use the same mocked publish method
  };

  return {
    redisClient: redisMock.createClient(),
    redisPublisher: mockPublisher, // Return the mocked publisher
    redisSubscriber: mockSubscriber,
    pubsub: mockPubSub,
  };
});
