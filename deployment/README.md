# Elestio Deployment Configuration

This directory contains the configuration files for deploying the Uru Chatbot on Elestio's platform.

## Files

- **`elestio.yml`** - Elestio deployment configuration (metadata and platform settings)
- **`ENV_VARS.md`** - Documentation of environment variables
- **`README.md`** - This file

## Deployment Structure

Elestio uses a two-file approach:

1. **`elestio.yml`** - Platform configuration that tells Elestio:
   - How to build and run the application (`dockerCompose` runtime)
   - What environment variables to inject
   - How to configure the reverse proxy and SSL
   - What ports to expose and how

2. **`docker-compose.yml`** (in project root) - Standard Docker Compose file that:
   - Defines the actual services (frontend, backend, database)
   - Uses environment variables injected by Elestio
   - Binds ports to `172.17.0.1` for Elestio's reverse proxy

## Key Features

### Build-Time Variables
- `NEXT_PUBLIC_API_URL` is properly handled at build time
- Elestio injects variables before Docker build process
- Uses `[CI_CD_DOMAIN]` placeholder for dynamic domain resolution

### Domain Configuration
- **Frontend**: `https://dynamosoftware.chat-dev.uruenterprises.com`
- **API**: `https://api.dynamosoftware.chat-dev.uruenterprises.com` (via port 8443)
- **API Docs**: Available at `/docs` endpoint

### Security
- All passwords auto-generated using `random_password`
- HTTPS enforced for all public endpoints
- CORS configured for specific domains only
- Database not exposed publicly

## Deployment Process

1. **Elestio reads `elestio.yml`** and understands the deployment requirements
2. **Environment variables are generated/injected** into a `.env` file
3. **Docker Compose build** runs with proper build args for `NEXT_PUBLIC_API_URL`
4. **Services start** with Elestio's reverse proxy handling SSL and routing
5. **Health checks and monitoring** are automatically configured

## Local Development vs Production

| Aspect | Local Development | Elestio Production |
|--------|------------------|-------------------|
| **Configuration** | `.env` file | `elestio.yml` + injected `.env` |
| **Domains** | `localhost:3000/8000` | Custom domains with SSL |
| **Database** | Local PostgreSQL | Managed PostgreSQL |
| **Secrets** | Manual in `.env` | Auto-generated |
| **SSL/HTTPS** | Not required | Automatic |
| **Reverse Proxy** | Direct port access | Elestio's nginx |

## Troubleshooting

### Build Issues
- Ensure `NEXT_PUBLIC_API_URL` is available at build time
- Check that all build args are properly passed in `docker-compose.yml`

### Runtime Issues
- Verify environment variables are properly injected
- Check port bindings use `172.17.0.1:PORT:CONTAINER_PORT` format
- Ensure services can communicate via Docker network

### Domain Issues
- Confirm `[CI_CD_DOMAIN]` placeholder is used correctly
- Verify port configuration in `elestio.yml` matches services
