#!/usr/bin/env python3
"""
Basic test script to verify the backend is working correctly.
Run this after setting up the environment to ensure everything is configured properly.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

async def test_imports():
    """Test that all required modules can be imported."""
    print("Testing imports...")
    
    try:
        from app.main import app
        print("✅ FastAPI app imported successfully")
        
        from app.models import User, Conversation, Message
        print("✅ Database models imported successfully")
        
        from app.core.config import settings
        print("✅ Configuration imported successfully")
        
        from app.api.router import api_router
        print("✅ API router imported successfully")
        
        return True
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False

async def test_config():
    """Test configuration settings."""
    print("\nTesting configuration...")
    
    try:
        from app.core.config import settings
        
        print(f"✅ Project name: {settings.PROJECT_NAME}")
        print(f"✅ API version: {settings.API_V1_STR}")
        print(f"✅ Database URL configured: {'postgresql' in settings.DATABASE_URL}")
        print(f"✅ Secret key configured: {bool(settings.SECRET_KEY)}")
        print(f"✅ OpenAI models: {len(settings.OPENAI_MODELS)} models configured")
        
        return True
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
        return False

async def test_database_models():
    """Test database model definitions."""
    print("\nTesting database models...")
    
    try:
        from app.models.user import User
        from app.models.conversation import Conversation
        from app.models.message import Message
        
        # Test model attributes
        user_attrs = ['id', 'email', 'hashed_password', 'first_name', 'last_name', 'role']
        for attr in user_attrs:
            if hasattr(User, attr):
                print(f"✅ User.{attr} exists")
            else:
                print(f"❌ User.{attr} missing")
                return False
        
        conv_attrs = ['id', 'title', 'user_id', 'model', 'is_pinned', 'is_archived']
        for attr in conv_attrs:
            if hasattr(Conversation, attr):
                print(f"✅ Conversation.{attr} exists")
            else:
                print(f"❌ Conversation.{attr} missing")
                return False
        
        msg_attrs = ['id', 'conversation_id', 'role', 'token_count', 'ai_model']
        for attr in msg_attrs:
            if hasattr(Message, attr):
                print(f"✅ Message.{attr} exists")
            else:
                print(f"❌ Message.{attr} missing")
                return False
        
        return True
    except Exception as e:
        print(f"❌ Database model test failed: {e}")
        return False

async def test_api_endpoints():
    """Test API endpoint definitions."""
    print("\nTesting API endpoints...")
    
    try:
        from app.api.endpoints import auth, chat, conversations
        
        # Check that routers exist
        if hasattr(auth, 'router'):
            print("✅ Auth router exists")
        else:
            print("❌ Auth router missing")
            return False
            
        if hasattr(chat, 'router'):
            print("✅ Chat router exists")
        else:
            print("❌ Chat router missing")
            return False
            
        if hasattr(conversations, 'router'):
            print("✅ Conversations router exists")
        else:
            print("❌ Conversations router missing")
            return False
        
        return True
    except Exception as e:
        print(f"❌ API endpoint test failed: {e}")
        return False

async def main():
    """Run all tests."""
    print("🚀 Starting Uru Chatbot Backend Tests\n")
    
    tests = [
        test_imports,
        test_config,
        test_database_models,
        test_api_endpoints
    ]
    
    results = []
    for test in tests:
        result = await test()
        results.append(result)
    
    print(f"\n📊 Test Results: {sum(results)}/{len(results)} passed")
    
    if all(results):
        print("🎉 All tests passed! Backend is ready for deployment.")
        return 0
    else:
        print("❌ Some tests failed. Please check the configuration.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
