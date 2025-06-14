# Environment Variables for Elestio Deployment

## Elestio Configuration

The deployment uses Elestio's standard Docker Compose deployment with environment variable injection. All variables are defined in `elestio.yml` and automatically injected by Elestio's platform.

## Environment Variables

| Variable | Elestio Value | Description |
|----------|---------------|-------------|
| **INSTANCE** | `[INSTANCE]` | Instance identifier from Elestio hosting environment variables |
| **SECRET_KEY** | `random_password` | Auto-generated JWT secret |
| **DB_USER** | `postgres` | Database username |
| **DB_PASSWORD** | `random_password` | Auto-generated database password |
| **DB_NAME** | `uru_chatbot` | Database name |
| **DATABASE_URL** | `postgresql+asyncpg://[DB_USER]:[DB_PASSWORD]@db:5432/[DB_NAME]` | Full database connection string |
| **NEXT_PUBLIC_API_URL** | `https://api.[INSTANCE].uruenterprises.com/api` | Frontend API endpoint (build-time) |
| **CORS_ORIGINS** | `["https://[INSTANCE].uruenterprises.com","https://api.[INSTANCE].uruenterprises.com"]` | CORS allowed origins |
| **ENVIRONMENT** | `production` | Application environment |

## Elestio Special Variables

- `[INSTANCE]` - Replaced with the actual instance name
- `[ENVIRONMENT]` - Replaced with the environment type (`production` or `development`) 
- `[DB_USER]` - Replaced with database username
- `[DB_PASSWORD]` - Replaced with generated password
- `[DB_NAME]` - Replaced with database name
- `random_password` - Generates secure random passwords

## Domain Structure

- **Frontend**: `https://[INSTANCE].uruenterprises.com` → `https://dynamosoftware.chat-dev.uruenterprises.com`
- **API**: `https://api.[INSTANCE].uruenterprises.com` → `https://api.dynamosoftware.chat-dev.uruenterprises.com`
- **API Docs**: `https://api.[INSTANCE].uruenterprises.com/docs`

## Build-Time Variables

The `NEXT_PUBLIC_API_URL` is required at build time for Next.js. Elestio handles this by:
1. Constructing `NEXT_PUBLIC_API_URL` using the `[INSTANCE]` placeholder
2. Passing it as a build arg to the Docker build process
3. The application falls back to localhost for development environments

## Security Notes

- All passwords are auto-generated by Elestio using `random_password`
- HTTPS is enforced for all endpoints
- CORS is configured to only allow the specific frontend and API domains
- Database is not exposed publicly (internal Docker network only)
