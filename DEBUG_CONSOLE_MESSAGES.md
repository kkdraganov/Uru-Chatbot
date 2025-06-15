# Debug Console Messages Tracking

This file tracks all debug console messages added for environment variable logging. These should be removed before shipping to production.

## Backend Debug Messages

### backend/app/core/config.py
- **Line ~32**: `logger.info(f"[CONFIG] SECRET_KEY loaded: {'***REDACTED***' if self.SECRET_KEY != 'development_secret_key' else 'development_secret_key'}")`
- **Line ~33**: `logger.info(f"[CONFIG] INSTANCE loaded: {self.INSTANCE}")`
- **Line ~34**: `logger.info(f"[CONFIG] Production mode: {self.is_production}")`
- **Line ~35**: `logger.info(f"[CONFIG] POSTGRES_USER: {self.POSTGRES_USER}")`
- **Line ~36**: `logger.info(f"[CONFIG] POSTGRES_DB: {self.POSTGRES_DB}")`
- **Line ~37**: `logger.info(f"[CONFIG] DATABASE_URL: {self.DATABASE_URL}")`
- **Line ~38**: `logger.info(f"[CONFIG] CORS_ORIGINS: {self.CORS_ORIGINS}")`
- **Line ~48**: `logger.info(f"[CONFIG] NODE_ENV: {node_env}, INSTANCE: {self.INSTANCE}, is_production: {is_prod}")`
- **Line ~60**: `logger.info(f"[CONFIG] CORS_ORIGINS from env (parsed JSON): {parsed_cors}")`
- **Line ~63**: `logger.info(f"[CONFIG] CORS_ORIGINS from env (single string): {cors_env}")`
- **Line ~73**: `logger.info(f"[CONFIG] CORS_ORIGINS auto-configured for production: {auto_cors}")`
- **Line ~78**: `logger.info(f"[CONFIG] CORS_ORIGINS auto-configured for development: {dev_cors}")`
- **Line ~96**: `logger.info(f"[CONFIG] DATABASE_URL from environment: {env_url}")`
- **Line ~100**: `logger.info(f"[CONFIG] DATABASE_URL constructed: {constructed_url}")`

### backend/app/main.py
- **Line ~20**: `logger.info(f"[MAIN] FastAPI app created: {settings.PROJECT_NAME}")`
- **Line ~21**: `logger.info(f"[MAIN] OpenAPI URL: {settings.API_V1_STR}/openapi.json")`
- **Line ~26**: `logger.info(f"[MAIN] Setting up CORS with origins: {cors_origins}")`

### backend/app/db/base.py
- **Line ~13**: `logger.info(f"[DB] Creating async engine with DATABASE_URL: {database_url}")`
- **Line ~14**: `logger.info(f"[DB] Engine config - pool_size: 20, max_overflow: 10, pool_timeout: 30s, pool_recycle: 1800s")`

## Frontend Debug Messages

### frontend/Dockerfile
- **Line ~16**: `RUN echo "Build args - NODE_ENV: $NODE_ENV, INSTANCE: $INSTANCE, NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"`

### frontend/next.config.js
- **Line ~4**: `console.log('[NEXT_CONFIG] NEXT_PUBLIC_API_URL from env:', process.env.NEXT_PUBLIC_API_URL);`
- **Line ~5**: `console.log('[NEXT_CONFIG] INSTANCE from env:', process.env.INSTANCE);`
- **Line ~6**: `console.log('[NEXT_CONFIG] ENVIRONMENT from env:', process.env.ENVIRONMENT);`
- **Line ~15**: `console.log('[NEXT_CONFIG] Final API URL:', apiUrl);`
- **Line ~35**: `console.log('[NEXT_CONFIG] Image domains configured:', allDomains);`

### frontend/src/lib/api.ts
- **Line ~6**: `console.log('[API] Checking NEXT_PUBLIC_API_URL from env:', process.env.NEXT_PUBLIC_API_URL);`
- **Line ~10**: `console.log('[API] Using NEXT_PUBLIC_API_URL from environment:', process.env.NEXT_PUBLIC_API_URL);`
- **Line ~16**: `console.log('[API] Browser detected, current hostname:', hostname);`
- **Line ~22**: `console.log('[API] Auto-detected production API URL from hostname:', apiUrl);`
- **Line ~25**: `console.log('[API] Hostname does not contain .uruenterprises.com, using localhost fallback');`
- **Line ~27**: `console.log('[API] Server-side rendering detected, using localhost fallback');`
- **Line ~31**: `console.log('[API] Using localhost fallback for development');`
- **Line ~53**: `console.log('[API] API Client initialized with baseURL:', API_URL);`
- **Line ~54**: `console.log('[API] Client config - timeout: 10000ms, withCredentials: true');`

## Environment Variables Being Logged

### Backend
- **SECRET_KEY**: Logged as redacted in production, full value in development
- **INSTANCE**: Instance identifier for domain construction
- **NODE_ENV**: Environment mode (development/production)
- **POSTGRES_USER**: Database username
- **POSTGRES_DB**: Database name
- **DATABASE_URL**: Full database connection string
- **CORS_ORIGINS**: CORS allowed origins (JSON array or single string)

### Frontend
- **NEXT_PUBLIC_API_URL**: API endpoint URL for frontend
- **INSTANCE**: Instance identifier for domain construction
- **NODE_ENV**: Node.js environment mode

### Database (PostgreSQL)
- **POSTGRES_USER**: Database username
- **POSTGRES_PASSWORD**: Database password (not logged for security)
- **POSTGRES_DB**: Database name

## Removal Instructions

To remove all debug messages before shipping:

1. **Backend**: Search for `logger.info` calls with `[CONFIG]`, `[MAIN]`, or `[DB]` prefixes
2. **Frontend**: Search for `console.log` calls with `[NEXT_CONFIG]` or `[API]` prefixes
3. Remove the logging import statements if no longer needed:
   - `import logging` and `logger = logging.getLogger(__name__)` in backend files
4. Remove this tracking file: `DEBUG_CONSOLE_MESSAGES.md`

## Notes

- All backend logging uses Python's `logging` module with INFO level
- All frontend logging uses `console.log` for browser/Node.js compatibility
- Sensitive information like passwords are never logged
- SECRET_KEY is redacted in production but shown in development for debugging
- Database connection strings may contain credentials, so they're logged carefully
- All messages include descriptive prefixes and file location comments for easy identification
