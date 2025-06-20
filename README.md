# Uru Chatbot

Professional AI chat interface with real-time streaming, simple authentication, and conversation history.

## Features
- **Real-time Streaming**: Live responses with Server-Sent Events
- **Multiple Models**: GPT-4o, GPT-4o-mini, o1, o1-mini support
- **Environment-based API Keys**: AI model provider API keys provided in backend environment variables from Elestio deployment
- **Conversation Management**: Create, edit, pin, archive conversations with user isolation
- **Simple Authentication**: Email/password registration and login with JWT tokens
- **SSO Ready**: Architecture prepared for future Google/Microsoft/Okta integration
- **Mobile Responsive**: Modern UI optimized for all devices
- **Comprehensive Testing**: 22+ tests covering database, repositories, integration, and schema validation

## Tech Stack
- **Backend**: FastAPI + PostgreSQL + Alembic + JWT Auth + SSE Streaming
- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **Database**: OOP-style SQLAlchemy with type-safe models and relationships. Simple three-table architecture with authentication:
  - **Users**: Email/password auth with preferences and future SSO support
  - **Conversations**: User-owned chat sessions with model and prompt settings
  - **Messages**: Chat messages with error handling
- **Deployment**: Docker Compose with Elestio optimization
- **Testing**: Comprehensive test suite with database validation, integration tests, and schema compliance

## Quick Start
```bash
git clone https://github.com/kkdraganov/Uru-Chatbot.git
cd Uru-Chatbot
cp .env.example .env
docker-compose -f docker-compose.dev.yml up -d
```

**Local Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Testing
Run the comprehensive test suite to validate the system:

```bash
# Database tests
cd tests
python test_database_schema.py
python test_database_sql.py
python test_database_repositories.py

# Integration tests
python test_database_integration.py
python test_backend_database_audit.py
```

**Test Coverage:**
- **22+ Tests Total**: Database schema, repositories, integration, and audit validation
- **100% Schema Compliance**: All models match DATABASE_OVERVIEW.md specification exactly
- **Production Validation**: End-to-end workflow testing with real database operations

## Production Deployment
Deploy to Elestio using `docker-compose.yml` with automatic SSL and domain configuration. System is **production-ready** with comprehensive validation.

## Documentation
- [Database Overview](backend/database/DATABASE_OVERVIEW.md) - Schema and OOP SQLAlchemy patterns
- [Architecture](ARCHITECTURE.md) - System design overview
- [Deployment Guide](DEPLOYMENT.md) - Production deployment steps