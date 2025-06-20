# Architecture

## System Overview
```
Browser ──► Next.js 15 ──► FastAPI ──► PostgreSQL
                              │
                              └──► OpenAI API (environment keys)
```

## Core Components
- **Frontend**: Next.js 15 + React 19 with SSE streaming
- **Backend**: FastAPI with JWT auth and user-based access control
- **Database**: PostgreSQL with OOP-style SQLAlchemy and comprehensive validation
- **Security**: Environment-based API keys, JWT tokens, input sanitization
- **Testing**: Comprehensive test suite with 22+ tests covering all layers

## Backend Structure
```
backend/
├── app/
│   ├── adapters/          # AI provider abstractions (OpenAI, factory)
│   ├── api/endpoints/     # Route handlers (auth, chat, conversations)
│   ├── core/              # Config, security, JWT
│   ├── db/repositories/   # Data access layer (User, Conversation, Message)
│   ├── models/            # SQLAlchemy models (validated against schema)
│   ├── schemas/           # Pydantic schemas (user, conversation, message, chat)
│   ├── services/          # Business logic services
│   └── streaming/         # SSE streaming implementation
└── database/
    ├── migrations/        # Alembic database migrations
    ├── alembic.ini        # Migration configuration
    └── DATABASE_OVERVIEW.md # Complete schema documentation
```

## Frontend Structure
```
frontend/src/
├── components/        # React components
├── contexts/          # Global state management
├── lib/               # API client, utilities
└── pages/             # Next.js routing
```

## Testing Structure
```
tests/
├── test_database_schemas.py        # Schema validation (6/6 tests)
├── test_database_sql.py            # SQL DDL validation
├── test_database_repositories.py   # Repository testing (4/4 suites)
├── test_database_integration.py    # End-to-end workflows (4/4 tests)
├── test_backend_database_audit.py  # Backend audit (5/5 tests)
```

## Key Patterns
- **Adapter Pattern**: Extensible AI provider support
- **Repository Pattern**: Clean data access separation with comprehensive testing
- **Context Providers**: Centralized state management
- **SSE Streaming**: Real-time response delivery
- **Environment-based Configuration**: Secure API key management via environment variables
- **OOP SQLAlchemy**: Type-safe models with `Mapped[]` annotations and rich relationships
- **Comprehensive Testing**: Multi-layer validation with database audit and integration tests

## Database Architecture
- **Three-table Design**: Users → Conversations → Messages with CASCADE deletes
- **Schema Compliance**: 100% validated against DATABASE_OVERVIEW.md specification
- **Type Safety**: Modern SQLAlchemy 2.0 with full type annotations
- **Migration Support**: Alembic with proper environment configuration
- **Audit Verified**: 22+ tests passing

## Production Readiness
- **✅ Database Audit Complete**: All schema inconsistencies resolved
- **✅ Comprehensive Testing**: 22+ tests covering all critical paths
- **✅ Schema Validation**: Strict compliance with documented specifications
- **✅ Integration Tested**: End-to-end workflows validated
- **✅ Production Deployment**: Docker Compose with Elestio optimization
