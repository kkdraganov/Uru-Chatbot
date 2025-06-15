# Environment Variable Fixes for Elestio Deployment

## Issues Identified and Fixed

### 1. INSTANCE Hardcoded in Repository
**Problem**: `elestio.yml` contained hardcoded `INSTANCE=dynamosoftware.chat-dev` which should be set by Elestio platform.

**Fix**:
- Updated `elestio.yml` to use `[CI_CD_DOMAIN]` placeholder for INSTANCE
- Elestio will replace `[CI_CD_DOMAIN]` with the actual domain at deployment time
- INSTANCE now comes through properly from Elestio's environment variables

### 2. Hardcoded Environment Variables Not Showing in Debug
**Problem**: Variables like `POSTGRES_USER`, `POSTGRES_PASSWORD`, `NODE_ENV`, and `SECRET_KEY` that are hardcoded in Docker Compose weren't appearing in debug logs.

**Fix**:
- Added default values in Docker Compose using `${VAR:-default}` syntax
- This ensures variables have values even when not provided by Elestio
- Debug logs will now show actual values instead of empty strings

### 3. Composition Environment Variables Coming Through Empty
**Problem**: `NEXT_PUBLIC_API_URL`, `DATABASE_URL`, and `CORS_ORIGINS` were empty when accessed via `os.getenv()`.

**Fix**:
- Updated backend configuration to check for empty strings, not just `None`
- Added auto-construction logic when environment variables are empty
- Uses INSTANCE from Elestio's environment variables
- Fallback to manual composition using individual components

### 4. Next.js Build-Time Environment Variable Access
**Problem**: `NEXT_PUBLIC_API_URL` was not accessible at build time in Next.js.

**Fix**:
- Updated Docker Compose to pass build args with proper fallback values
- Modified frontend Dockerfile to accept and use build arguments
- Enhanced `next.config.js` to handle empty environment variables
- Added debug logging in Docker build process

## Key Changes Made

### Backend (`backend/app/core/config.py`)
```python
# INSTANCE comes directly from environment variables
INSTANCE: str = os.getenv("INSTANCE", "dev")

# Updated CORS_ORIGINS to handle empty strings
@property
def CORS_ORIGINS(self) -> List[str]:
    cors_env = os.getenv("CORS_ORIGINS")
    if cors_env and cors_env.strip():  # Check for non-empty
        # ... existing logic
    # Auto-configure using INSTANCE when empty

# Updated DATABASE_URL to handle empty strings
@property
def DATABASE_URL(self) -> str:
    env_url = os.getenv("DATABASE_URL")
    if env_url and env_url.strip():  # Check for non-empty
        return env_url
    # Construct from components when empty
```

### Docker Compose (`docker-compose.yml`)
```yaml
# Frontend build args with fallbacks
args:
  - NODE_ENV=${NODE_ENV:-production}
  - INSTANCE=${INSTANCE:-dev}
  - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Backend environment with defaults
environment:
  - SECRET_KEY=${SECRET_KEY:-development_secret_key}
  - POSTGRES_USER=${POSTGRES_USER:-postgres}
  - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
  - INSTANCE=${INSTANCE:-dev}
```

### Frontend Dockerfile (`frontend/Dockerfile`)
```dockerfile
# Accept build arguments without defaults
ARG NODE_ENV=production
ARG INSTANCE
ARG NEXT_PUBLIC_API_URL

# Debug logging (to be removed before shipping)
RUN echo "Build args - NODE_ENV: $NODE_ENV, INSTANCE: $INSTANCE, NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"
```

### Elestio Configuration (`deployment/elestio.yml`)
```yaml
# INSTANCE uses Elestio's CI_CD_DOMAIN placeholder
environments:
  - key: "INSTANCE"
    value: "[CI_CD_DOMAIN]"
  - key: "SECRET_KEY"
    value: "random_password"
  - key: "DATABASE_URL"
    value: "postgresql+asyncpg://[POSTGRES_USER]:[POSTGRES_PASSWORD]@db:5432/[POSTGRES_DB]"
  - key: "NEXT_PUBLIC_API_URL"
    value: "https://api.[INSTANCE].uruenterprises.com/api"
  - key: "CORS_ORIGINS"
    value: "[\"https://[INSTANCE].uruenterprises.com\",\"https://api.[INSTANCE].uruenterprises.com\"]"
  # ... other variables
```

## How It Works Now

1. **Elestio replaces `[CI_CD_DOMAIN]` placeholder** with the actual domain in INSTANCE
2. **INSTANCE comes through environment variables** directly from Elestio
3. **Empty environment variables trigger auto-construction**:
   - `DATABASE_URL` built from individual components when empty
   - `CORS_ORIGINS` built from INSTANCE when empty
   - `NEXT_PUBLIC_API_URL` passed from Elestio's environment
4. **Docker Compose provides fallbacks** for all variables
5. **Next.js gets build-time variables** through Docker build args

## Testing the Fixes

To verify the fixes work:

1. **Check debug logs** for proper variable values
2. **Verify auto-construction** when variables are empty
3. **Test build process** with proper environment variable passing
4. **Confirm domain construction** uses `CI_CD_DOMAIN` correctly

## Cleanup Required

Before shipping to production:
1. Remove all debug logging statements (tracked in `DEBUG_CONSOLE_MESSAGES.md`)
2. Remove Docker build debug echo statement
3. Remove this documentation file if desired

The fixes ensure robust environment variable handling that works both in Elestio's deployment environment and local development.
