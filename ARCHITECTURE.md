# Architecture

## System Overview
```
Browser ──► Next.js 15 ──► FastAPI ──► PostgreSQL
                              │
                              └──► OpenAI API (client keys)
```

## Core Components
- **Frontend**: Next.js 15 + React 19 with SSE streaming
- **Backend**: FastAPI with JWT auth and role-based access
- **Database**: PostgreSQL for metadata only (messages never stored)
- **Security**: Client-side encrypted API keys, JWT tokens

## Backend Structure
```
backend/app/
├── adapters/          # AI provider abstractions
├── api/endpoints/     # Route handlers (auth, chat)
├── core/              # Config, security, JWT
├── db/repositories/   # Data access layer
├── models/            # SQLAlchemy models
└── schemas/           # Pydantic schemas
```

## Frontend Structure
```
frontend/src/
├── components/        # React components
├── contexts/          # Global state management
├── lib/               # API client, utilities
└── pages/             # Next.js routing
```

## Key Patterns
- **Adapter Pattern**: Extensible AI provider support
- **Repository Pattern**: Clean data access separation
- **Context Providers**: Centralized state management
- **SSE Streaming**: Real-time response delivery
- **Client-side Encryption**: Secure API key storage
