# Environment Variables

## Required Variables

| Variable | Local Dev | Production | Description |
|----------|-----------|------------|-------------|
| **INSTANCE** | `dev` | Your instance name | Determines domain names |

## Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| **SECRET_KEY** | `development_secret_key` | Auto-generated | JWT token secret |
| **POSTGRES_USER** | `postgres` | Auto-generated | Database username |
| **POSTGRES_PASSWORD** | `postgres` | Auto-generated | Database password |
| **NEXT_PUBLIC_API_URL** | Auto-constructed from INSTANCE | Frontend API endpoint |
| **DATABASE_URL** | Auto-constructed from DB credentials | Database connection string |
| **CORS_ORIGINS** | Auto-configured based on INSTANCE | CORS allowed origins |

## Setup

**Local:** `cp .env.example .env && docker-compose up`
**Production:** Deploy with `deployment/elestio.yml` (auto-configured)

## Security Notes

- The SECRET_KEY should be a strong, randomly generated string
- The POSTGRES_PASSWORD should be a strong, randomly generated password
- API keys for OpenAI are stored client-side only and never sent to the server
- All communication must be over HTTPS in production
