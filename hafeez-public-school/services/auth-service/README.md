
# Auth Service

## Overview

The Authentication Service handles all authentication and authorization operations for the Hafeez Public School system. It provides JWT-based authentication, refresh token rotation, password management, and session tracking.

## Features

- **JWT Authentication**: Secure token-based authentication
- **Refresh Token Rotation**: Automatic token refresh with rotation for security
- **Password Management**: Secure password hashing with bcrypt
- **Session Management**: Track active sessions with Redis
- **Rate Limiting**: Protect against brute force attacks
- **Email Verification**: Verify user email addresses (TODO)
- **Two-Factor Authentication**: Enhanced security with 2FA (TODO)

## Architecture

auth-service/
├── src/
│   ├── config/        # Configuration management
│   ├── controllers/   # Request handlers
│   ├── services/      # Business logic
│   ├── models/        # MongoDB models
│   ├── routes/        # API routes
│   ├── middlewares/   # Express middlewares
│   ├── validators/    # Request validation schemas
│   ├── utils/         # Utility functions
│   └── types/         # TypeScript type definitions

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register a new user |
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/refresh-token` | Refresh access token |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password` | Reset password with token |

### Protected Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/logout` | User logout |
| POST | `/api/v1/auth/change-password` | Change password |
| GET | `/api/v1/auth/me` | Get current user info |

## Environment Variables

See [.env.example](.env.example) for all required environment variables.

### Required Variables

- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret key for JWT signing (min 32 characters)

## Development

### Prerequisites

- Node.js >= 18.0.0
- MongoDB instance
- Redis instance

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your values
