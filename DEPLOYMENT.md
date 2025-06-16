# Deployment Guide

## Overview
Professional ChatGPT-style interface with real-time streaming and secure API key management.

## Requirements
- Docker & Docker Compose
- OpenAI API key (user-provided)
- PostgreSQL database (included in Docker setup)

## Local Development

1. **Setup**
   ```bash
   git clone https://github.com/kkdraganov/Uru-Chatbot.git
   cd Uru-Chatbot
   cp .env.example .env
   docker-compose up -d
   ```

2. **Access**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

3. **First Use**
   - Register account (first user becomes admin)
   - Add OpenAI API key in settings
   - Start chatting

## Production Deployment (Elestio)

1. **Deploy**
   - Upload `docker-compose.yml` to Elestio
   - Set environment variables in Elestio dashboard:
     - `INSTANCE=your-instance-name`
     - `SECRET_KEY=secure-random-key`
     - `DB_PASSWORD=secure-random-password`

2. **Access**
   - Frontend: `https://${INSTANCE}.uruenterprises.com`
   - Backend API: `https://api.${INSTANCE}.uruenterprises.com`

## Environment Variables

| Variable | Default Value | Description |
|----------|---------------|-------------|
| **INSTANCE** | `dev` | Instance identifier from Elestio hosting environment variables
| **ENVIRONMENT** | `production` | Application environment
| **DB_USER** | `postgres` | Database username
| **DB_PASSWORD** | `postgres` | Database password
| **DB_NAME** | `uru_chatbot` | Database name
| **SECRET_KEY** | `development_secret_key` | JWT secret


## Security Features
- Client-side encrypted API keys (never server-stored)
- JWT authentication with role-based access
- HTTPS enforced in production
- Input sanitization and CORS protection

## Troubleshooting
- Check `/docs` for API documentation
- Verify OpenAI API key validity
- Review Docker container logs
- Ensure network connectivity to OpenAI
