# Uru Chatbot

Professional AI chat interface with real-time streaming, secure API key management, and conversation history.

## Features
- **Real-time Streaming**: Live responses with Server-Sent Events
- **Multiple Models**: GPT-4o, GPT-4o-mini, o1, o1-mini support
- **Secure API Keys**: Client-side encrypted, never server-stored
- **Conversation Management**: Create, edit, pin, archive conversations
- **Role-based Auth**: JWT authentication with admin/user/viewer roles
- **Mobile Responsive**: Modern UI optimized for all devices

## Tech Stack
- **Backend**: FastAPI + PostgreSQL + JWT Auth + SSE Streaming
- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **Deployment**: Docker Compose with Elestio optimization

## Quick Start
```bash
git clone https://github.com/kkdraganov/Uru-Chatbot.git
cd Uru-Chatbot
cp .env.example .env
docker-compose up -d
```

**Local Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Production Deployment
Deploy to Elestio using `docker-compose.yml` with automatic SSL and domain configuration.

## Documentation
- [Architecture](ARCHITECTURE.md) - System design overview
- [Deployment Guide](DEPLOYMENT.md) - Production deployment steps