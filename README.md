# Uru ChatGPT Interface - Project Documentation

## Project Overview

The Uru ChatGPT Interface is a web application that allows clients to use their own OpenAI API keys through Uru's branded platform. The application provides a ChatGPT-style interface with streaming responses, conversation management, and secure client-side API key handling.

## Tech Stack

- **Backend**: FastAPI with async/streaming support
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Database**: PostgreSQL (metadata only - no message storage)
- **Authentication**: JWT-based with role system foundation
- **Deployment**: Elestio with custom domain support

## Key Features

1. **Multi-Model Chat Interface**
   - ChatGPT-style UI with model selector dropdown
   - Support for GPT-4o, GPT-4o-mini, o1-preview, o1-mini
   - Real-time streaming responses via Server-Sent Events (SSE)
   - Conversation history and management

2. **Client API Key Management**
   - Settings panel for API key input/validation
   - Client-side encryption before storage
   - No server-side API key storage
   - Real-time validation with OpenAI API

3. **Streaming Architecture**
   - SSE implementation with cross-browser compatibility
   - Auto-reconnection with exponential backoff
   - Mid-conversation model switching

4. **Future-Proof Design**
   - Abstract ModelAdapter pattern for multi-provider support
   - Role-based permissions (admin/user/viewer)
   - OAuth-ready authentication structure

## Project Structure

```
uru-chatgpt-interface/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── adapters/          # AI provider abstractions
│   │   ├── api/               # Route handlers
│   │   ├── models/            # Database models (metadata only)
│   │   ├── streaming/         # SSE implementation
│   │   └── core/              # Auth, config, security
│   └── requirements.txt
├── frontend/                   # Next.js application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── contexts/          # Global state management
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utility functions
│   │   ├── pages/             # Next.js pages
│   │   └── styles/            # CSS styles
├── deployment/                 # Deployment configuration
│   ├── nginx/                 # Nginx configuration
│   ├── certbot/               # SSL certificate management
│   └── elestio.yml            # Elestio configuration
└── docker-compose.yml          # Docker Compose configuration
```

## Setup Instructions

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Local Development

1. **Clone the repository**

```bash
git clone <repository-url>
cd uru-chatgpt-interface
```

2. **Set up the backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Set up the frontend**

```bash
cd frontend
npm install
```

4. **Start the development servers**

Backend:
```bash
cd backend
uvicorn app.main:app --reload
```

Frontend:
```bash
cd frontend
npm run dev
```

### Production Deployment with Elestio

1. **Set up Elestio account**

2. **Configure environment variables**
   - See `deployment/ENV_VARS.md` for required variables

3. **Deploy using Elestio CLI**

```bash
elestio deploy -f deployment/elestio.yml
```

## Security Considerations

- **API Key Handling**: Client-side only, encrypted localStorage, HTTPS transmission
- **No Data Persistence**: Store conversation metadata only, never message content
- **Rate Limiting**: Prevent abuse of client API keys
- **Input Validation**: Comprehensive sanitization

## Additional Documentation

- `ARCHITECTURE.md`: Detailed architecture design
- `VALIDATION.md`: Security and streaming validation checklist
- `SECURITY_VALIDATION_REPORT.md`: Security validation results
- `deployment/ENV_VARS.md`: Environment variables documentation
