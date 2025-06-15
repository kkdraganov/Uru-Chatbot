# Architecture

## System Overview
```
Browser ──► Next.js ──► FastAPI ──► PostgreSQL
                           │
                           └──► OpenAI API (client keys)
```

## Key Components
- **Frontend**: Next.js chat interface with client-side API key encryption
- **Backend**: FastAPI with SSE streaming and JWT auth
- **Database**: PostgreSQL for conversation metadata only (no messages stored)
- **Security**: Client-side API key storage, server never sees keys

## Backend Structure
```
backend/app/
├── adapters/          # AI provider abstractions
├── api/endpoints/     # Route handlers
├── core/              # Config, auth, security
├── models/            # Database models
└── streaming/         # SSE implementation
```

## Key Patterns
- **ModelAdapter**: Abstraction for AI providers (OpenAI, future: Anthropic, etc.)
- **SSE Streaming**: Real-time chat responses via Server-Sent Events
- **Repository Pattern**: Clean data access layer
- **JWT Auth**: Token-based authentication with role support

## Frontend Structure
```
frontend/src/
├── components/        # React components
├── contexts/          # Global state (Auth, Chat)
├── hooks/             # Custom hooks (SSE, Auth)
├── lib/               # API client, encryption
└── pages/             # Next.js pages

