# Uru ChatGPT Interface

Web application allowing clients to use their own OpenAI API keys through Uru's branded platform.

## Tech Stack
- **Backend**: FastAPI + PostgreSQL
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Deployment**: Elestio

## Features
- ChatGPT-style interface with streaming responses
- Client-side API key management (no server storage)
- Multi-model support (GPT-4o, o1-preview, etc.)
- Conversation management

## Quick Setup
```bash
git clone <repository-url>
cd uru-chatbot
cp .env.example .env
docker-compose up --build
```
Access: http://localhost:3000