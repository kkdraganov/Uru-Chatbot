# Uru Chatbot - Deployment Guide

## Overview

Uru Chatbot is a professional AI chat interface that allows users to interact with OpenAI models using their own API keys. The application features real-time streaming, conversation management, and enterprise-grade security.

## Architecture

- **Frontend**: Next.js 15 with React 19, TypeScript and Tailwind CSS
- **Backend**: FastAPI with Python 3.11+
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT-based with role-based access control
- **Deployment**: Docker Compose ready for Elestio

## Features

✅ **ChatGPT-style Interface**: Modern, responsive chat UI with real-time streaming
✅ **Multiple OpenAI Models**: Support for GPT-4o, GPT-4o-mini, o1, o1-mini, and more
✅ **Client-side API Keys**: Secure, encrypted storage in browser (never server-stored)
✅ **Conversation Management**: Create, edit, pin, archive, and delete conversations
✅ **Role-based Access**: Admin, user, and viewer roles with appropriate permissions
✅ **Real-time Streaming**: Server-Sent Events for live message streaming
✅ **Cost Tracking**: Token counting and cost estimation for API usage
✅ **Dark/Light Mode**: Full theme support with system preference detection
✅ **Mobile Responsive**: Optimized for all device sizes

## Quick Start

### Local Development

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd uru-chatbot
   cp .env.example .env
   ```

2. **Configure Environment**
   Edit `.env` file with your settings:
   ```env
   SECRET_KEY=your_secret_key_here
   DB_PASSWORD=your_db_password
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

3. **Start Services**
   ```bash
   docker-compose up -d
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Production Deployment (Elestio)

The application is optimized for Elestio deployment with automatic configuration:

1. **Deploy to Elestio**
   - Use the provided `docker-compose.yml`
   - Set `INSTANCE` environment variable in Elestio dashboard
   - Configure database credentials

2. **Domain Configuration**
   - Frontend: `https://${INSTANCE}.uruenterprises.com`
   - Backend API: `https://api.${INSTANCE}.uruenterprises.com`

3. **Environment Variables**
   Required in Elestio:
   ```env
   INSTANCE=your-instance-name
   SECRET_KEY=auto-generated-secure-key
   DB_PASSWORD=auto-generated-password
   ```

## Usage

### First Time Setup

1. **Register Account**
   - Visit the application URL
   - Click "Sign up" to create an account
   - First user automatically gets admin role

2. **Configure OpenAI API Key**
   - Click settings icon in header
   - Enter your OpenAI API key
   - Validate the key to ensure it works
   - Save the key (stored encrypted in browser)

3. **Start Chatting**
   - Create a new conversation
   - Select your preferred model
   - Start chatting with AI

### Key Features

- **Model Switching**: Change models mid-conversation
- **Conversation Management**: Organize chats with titles, pinning, archiving
- **Real-time Responses**: See AI responses as they're generated
- **Cost Tracking**: Monitor token usage and estimated costs
- **Export Conversations**: Download chat history
- **Admin Dashboard**: Manage users and system settings (admin only)

## Security

- **Client-side API Keys**: OpenAI keys never leave your browser
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Granular permissions system
- **Input Sanitization**: XSS and injection protection
- **Rate Limiting**: Prevent abuse and ensure fair usage
- **HTTPS Enforced**: All production traffic encrypted

## Support

For issues or questions:
1. Check the API documentation at `/docs`
2. Review application logs in Docker containers
3. Ensure OpenAI API key is valid and has sufficient credits
4. Verify network connectivity to OpenAI services

## License

Enterprise-grade application built for professional use.
