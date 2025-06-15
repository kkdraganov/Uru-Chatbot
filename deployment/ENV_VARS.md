# Environment Variables

## Essential Variables (Only 4!)

| Variable | Local Dev | Production |
|----------|-----------|------------|
| **INSTANCE** | `dev` | Your instance name |
| **SECRET_KEY** | `development_secret_key` | Auto-generated |
| **POSTGRES_USER** | `postgres` | Auto-generated |
| **POSTGRES_PASSWORD** | `postgres` | Auto-generated |

## Setup

**Local:** `cp .env.example .env && docker-compose up`
**Production:** Deploy with `deployment/elestio.yml` (auto-configured)

## Security Notes

- The JWT_SECRET should be a strong, randomly generated string
- The DB_PASSWORD should be a strong, randomly generated password
- API keys for OpenAI are stored client-side only and never sent to the server
- All communication must be over HTTPS in production
