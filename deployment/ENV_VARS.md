# Environment Variables Documentation

This document describes the environment variables used in the Uru ChatGPT Interface project.

## Backend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| DATABASE_URL | PostgreSQL connection string | Yes | postgresql+asyncpg://postgres:postgres@localhost/uru_chatbot |
| SECRET_KEY | Secret key for JWT token generation | Yes | development_secret_key |
| ALGORITHM | JWT encryption algorithm | No | HS256 |
| ACCESS_TOKEN_EXPIRE_MINUTES | JWT token expiration time in minutes | No | 30 |
| CORS_ORIGINS | Allowed CORS origins | No | ["http://localhost:3000", "https://dynamosoftware.elestio.app"] |

## Frontend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| NEXT_PUBLIC_API_URL | URL of the backend API | Yes | http://localhost:8000/api |

## Deployment Environment Variables

These variables are used in the Elestio deployment configuration:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| INSTANCE_NAME | Instance name for subdomain | Yes | - |
| JWT_SECRET | Secret key for JWT token generation | Yes | - |
| DB_USER | Database username | Yes | postgres |
| DB_PASSWORD | Database password | Yes | - |
| DB_NAME | Database name | Yes | uru_chatbot |

## Security Notes

- The JWT_SECRET should be a strong, randomly generated string
- The DB_PASSWORD should be a strong, randomly generated password
- API keys for OpenAI are stored client-side only and never sent to the server
- All communication must be over HTTPS in production
