// Redis mock utilities for testing

// Mock Redis client for testing
export const createMockRedisClient = () => {
  const mockClient = {
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    isReady: true,
  };

  return mockClient;
};

// Mock the Redis client creation
export const mockRedisClient = createMockRedisClient();

// Mock the getRedisClient function
export const mockGetRedisClient = jest.fn(() => mockRedisClient);

// Reset all mocks
export const resetRedisMocks = () => {
  jest.clearAllMocks();
  mockRedisClient.get.mockReset();
  mockRedisClient.setEx.mockReset();
  mockRedisClient.del.mockReset();
  mockRedisClient.keys.mockReset();
  mockRedisClient.connect.mockReset();
  mockRedisClient.disconnect.mockReset();
  mockRedisClient.on.mockReset();
};
