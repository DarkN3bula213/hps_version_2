# Auth Service Tests

This directory contains comprehensive tests for the AuthService, covering both unit and integration testing scenarios.

## Test Structure

```shell
tests/
├── fixtures/
│   └── auth.fixtures.ts          # Test data and mock objects
├── helpers/
│   └── redis.mock.ts             # Redis mocking utilities
├── integration/
│   └── auth.integration.test.ts  # Integration tests with real DB/Redis
├── unit/
│   ├── auth.service.test.ts      # Comprehensive unit tests
│   └── auth.service.simple.test.ts # Simplified unit tests
├── setup.ts                      # Test setup and teardown
└── README.md                     # This file
```

## Test Categories

### Unit Tests (`unit/`)

Unit tests focus on testing individual methods in isolation with mocked dependencies.

**Coverage:**

- ✅ User registration (success and failure cases)
- ✅ User login (success and failure cases)
- ✅ User logout
- ✅ Token refresh
- ✅ Password reset flow
- ✅ Password change
- ✅ User retrieval by ID
- ✅ Error handling for all scenarios

**Key Features:**

- Mocked database operations
- Mocked Redis operations
- Mocked JWT operations
- Comprehensive error scenario testing
- Edge case coverage

### Integration Tests (`integration/`)

Integration tests test the complete flow with real database and Redis interactions.

**Coverage:**

- ✅ Complete user registration and login flow
- ✅ Token validation and refresh
- ✅ Session management
- ✅ Password reset with real Redis operations
- ✅ Database persistence verification
- ✅ Redis token storage verification

**Key Features:**

- Real MongoDB operations
- Real Redis operations
- Complete end-to-end flow testing
- Data persistence verification
- Token lifecycle testing

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Unit Tests Only

```bash
npm test -- --testPathPattern=unit
```

### Run Integration Tests Only

```bash
npm test -- --testPathPattern=integration
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

## Test Data

The `fixtures/auth.fixtures.ts` file contains all test data including:

- **User Data**: Valid users, admin users, inactive users
- **Login Data**: Valid credentials, invalid credentials
- **Registration Data**: New user data, duplicate user data
- **Token Data**: Valid and invalid refresh tokens
- **Password Reset Data**: Valid and invalid reset tokens
- **Session Data**: Mock session information

## Mock Objects

### User Mock

```typescript
const mockUserDoc = {
  _id: 'user-123',
  email: 'test@example.com',
  userType: UserType.STUDENT,
  profileId: 'student-123',
  isActive: true,
  isEmailVerified: false,
  comparePassword: jest.fn().mockResolvedValue(true),
  toJSON: jest.fn().mockReturnValue({...}),
};
```

### Redis Mock

```typescript
const mockRedisClient = {
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
};
```

## Test Scenarios

### Registration Tests

1. **Successful Registration**
   - Validates user creation
   - Verifies token generation
   - Checks database persistence

2. **Duplicate User Registration**
   - Tests email uniqueness validation
   - Verifies appropriate error response

### Login Tests

1. **Successful Login**
   - Validates credential verification
   - Tests session creation
   - Verifies token generation

2. **Failed Login Scenarios**
   - Non-existent user
   - Incorrect password
   - Inactive account

### Token Management Tests

1. **Token Refresh**
   - Validates refresh token verification
   - Tests new token generation
   - Verifies old token cleanup

2. **Logout**
   - Tests token removal from Redis
   - Verifies session cleanup

### Password Management Tests

1. **Forgot Password**
   - Tests reset token generation
   - Validates Redis storage
   - Handles non-existent users gracefully

2. **Reset Password**
   - Validates token verification
   - Tests password update
   - Verifies session invalidation

3. **Change Password**
   - Tests current password verification
   - Validates password update
   - Verifies session cleanup

## Error Handling Tests

All methods include comprehensive error handling tests:

- **AppError Class**: Proper error types and messages
- **Status Codes**: Correct HTTP status codes
- **Error Codes**: Consistent error codes for client handling

## Coverage Goals

- **Unit Tests**: 95%+ line coverage
- **Integration Tests**: 90%+ functional coverage
- **Error Scenarios**: 100% error path coverage

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on other tests
2. **Cleanup**: Proper cleanup after each test
3. **Mocking**: Appropriate use of mocks for external dependencies
4. **Assertions**: Clear and specific assertions
5. **Data**: Use fixtures for consistent test data

## Debugging Tests

### Enable Debug Logging

```bash
DEBUG=* npm test
```

### Run Single Test

```bash
npm test -- --testNamePattern="should register a new user successfully"
```

### View Test Output

```bash
npm test -- --verbose
```

## Common Issues

1. **Redis Connection**: Ensure Redis is running for integration tests
2. **MongoDB Connection**: Tests use in-memory MongoDB
3. **JWT Secrets**: Tests use test-specific JWT secrets
4. **Async Operations**: All tests properly handle async/await

## Adding New Tests

When adding new functionality to AuthService:

1. **Unit Tests**: Add to `unit/auth.service.test.ts`
2. **Integration Tests**: Add to `integration/auth.integration.test.ts`
3. **Fixtures**: Add test data to `fixtures/auth.fixtures.ts`
4. **Documentation**: Update this README with new test scenarios
