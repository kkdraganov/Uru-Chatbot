# Uru Chatbot - Build Requirements

Build a professional AI chat interface application using Next.js 15 + FastAPI that allows clients to use their own OpenAI API keys for ChatGPT-style conversations, with enterprise-grade features and multi-model support. Call it "Uru Chatbot." The application should meet the following requirements: 

## 1. User Interface:
- Create a **ChatGPT-style interface** with a modern, professional design matching contemporary AI chat applications.
- Implement a **responsive chat layout** with:
  - **Message container**: Scrollable chat history with user and assistant message bubbles
  - **Model selector dropdown**: Prominent header element for switching between OpenAI models (GPT-4o, GPT-4o-mini, o1, o1-mini, GPT-4-turbo, GPT-4, GPT-3.5-turbo) 
  - **Input area**: Text input with send button, supporting multi-line messages
  - **Sidebar**: Conversation list with new chat creation and conversation management
  - **Settings panel**: Accessible via header button for API key management and user preferences
- Include **authentication UI** with login/logout functionality and role-based interface elements (admin, user, viewer).
- Implement **real-time streaming** with typing indicators, loading states, and smooth message rendering.
- Use **Tailwind CSS** for modern styling with proper dark/light mode support and mobile-first responsive design.

## 2. Backend Architecture:
- Build a **FastAPI backend** with Python 3.11+ providing:
  - **JWT authentication system** with role-based access control (admin, user, viewer)
  - **OpenAI proxy endpoints** that use client-provided API keys (never stored server-side)
  - **Server-Sent Events (SSE)** for real-time message streaming
  - **Conversation storage** using PostgreSQL
  - **Rate limiting and security** with input sanitization, CORS configuration, and error handling
- Implement **model abstraction layer** supporting multiple OpenAI models with seamless switching mid-conversation.
- Create **comprehensive error handling** for OpenAI API issues (rate limits, quota exceeded, invalid keys, authentication errors).

## 3. Functionality:
- **Authentication & User Management**:
  - User registration and login with JWT tokens
  - Role-based permissions (admin, user, viewer) with appropriate feature access
  - Secure session management with token refresh capabilities
- **Chat Features**:
  - **Real-time conversations** with OpenAI models using client's API key
  - **Model switching** mid-conversation without losing context
  - **Message history** persistence across sessions
  - **Conversation management** with create, list, access, and delete operations
  - **Auto-generated conversation titles** or user-editable titles
- **API Key Management**:
  - **Settings panel** for secure API key entry and validation
  - **Client-side encryption** of API keys (never sent to or stored on server)
  - **Real-time validation** with helpful error messages and troubleshooting guidance

## 4. Technical Requirements:
- **Frontend Stack**: React 19 + TypeScript + Next.js 15 + Tailwind CSS with modern React patterns and hooks
- **Backend Stack**: FastAPI + Python 3.11 + PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT-based with secure token handling and refresh mechanisms
- **Database Design**: Store all relevant conversation data to be able to have chat histories
- **Security Standards**:
  - Input sanitization and XSS prevention
  - Rate limiting (per-user and global)
  - CORS configuration for production deployment
  - Environment variable management for secrets
- **Performance Targets**:
  - < 2 second initial application load time
  - < 100ms UI response to user interactions
  - Real-time streaming without perceptible delays
  - < 500ms model switching transitions
  - 99%+ uptime and reliability
- **Error Handling**:
  - Graceful degradation for API failures
  - Auto-reconnection for connection issues
  - User-friendly error messages with actionable guidance
  - Comprehensive logging for debugging and monitoring

## 5. Deployment & Infrastructure:
- **Docker Compose** configuration for both frontend and backend services
- **Elestio-ready deployment** with custom domain support and SSL configuration
- **Environment management** with separate development/production configurations
- **Database migrations** and seed data for initial setup
- **Health checks** and monitoring endpoints for service reliability
- **Logging and observability** for production troubleshooting

## 6. Advanced Features:
- **Multi-tenancy support** with proper data isolation between users
- **Conversation export** functionality for users to download their chat history
- **Admin user management** for user administration (admin role only)
- **API documentation** with FastAPI's automatic OpenAPI generation
- **Comprehensive testing** with unit tests for critical backend functionality

## 7. Constraints:
- **No server-side API key storage** - all OpenAI API calls must use client-provided keys
- **Conversation persistence** - store conversations for later access by user
- **Client-side key encryption** - API keys encrypted in browser storage only
- **Production-ready code** with proper error handling, logging, and security measures
- **Scalable architecture** that can handle multiple concurrent users and conversations

## 8. Deliverables:
- **Complete full-stack application** with frontend and backend fully integrated
- **Docker Compose setup** ready for Elestio deployment
- **Database schema** and migration scripts
- **Environment configuration** templates (.env.example files)
- **API documentation** and deployment instructions
- **Production-ready codebase** with security best practices and error handling

Build a complete, enterprise-grade application that provides a professional ChatGPT-equivalent experience while maintaining complete client control over their OpenAI API usage and costs.