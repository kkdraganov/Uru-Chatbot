from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta

from app.core.config import settings
from app.core.security import create_access_token, verify_password, get_password_hash
from app.db.base import get_db
from app.db.repositories.user import UserRepository
from app.models.user import User
from app.api.dependencies import get_current_active_user
from app.schemas.user import User as UserResponse, UserCreate, Token, UserRegister
from msal import ConfidentialClientApplication
from pydantic import BaseModel
import requests
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user."""
    try:
        user_repo = UserRepository(db)

        # Check if user already exists
        existing_user = await user_repo.get_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Create new user
        user = await user_repo.create(user_data)
        return user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login and get access token."""
    try:
        user_repo = UserRepository(db)

        # Get user by email
        user = await user_repo.get_by_email(form_data.username)
        if not user or not verify_password(form_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )

        # Update last login
        await user_repo.update_last_login(user.id)

        # Create access token (removed phantom field reference)
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email, "user_id": user.id},
            expires_delta=access_token_expires
        )

        # Create refresh token (longer expiry)
        refresh_token_expires = timedelta(days=7)
        refresh_token = create_access_token(
            data={"sub": user.email, "user_id": user.id, "type": "refresh"},
            expires_delta=refresh_token_expires
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user information."""
    return current_user

@router.get("/azure-config")
async def get_azure_config():
    """Get Azure configuration for debugging."""
    return {
        "client_id": settings.AZURE_CLIENT_ID,
        "tenant_id": settings.AZURE_TENANT_ID,
        "redirect_uri": settings.AZURE_REDIRECT_URI,
        "authority": f"https://login.microsoftonline.com/{settings.AZURE_TENANT_ID}",
        "auth_url": f"https://login.microsoftonline.com/{settings.AZURE_TENANT_ID}/oauth2/v2.0/authorize"
    }

class AzureLoginRequest(BaseModel):
    code: str

@router.post("/azure-login", response_model=Token)
async def azure_login(
    request: AzureLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Login with Microsoft Azure AD."""
    try:
        logger.info(f"Azure login attempt with code: {request.code[:20]}...")
        logger.info(f"Azure config - Client ID: {settings.AZURE_CLIENT_ID}")
        logger.info(f"Azure config - Tenant ID: {settings.AZURE_TENANT_ID}")
        logger.info(f"Azure config - Redirect URI: {settings.AZURE_REDIRECT_URI}")

        # Initialize the MSAL app
        app = ConfidentialClientApplication(
            settings.AZURE_CLIENT_ID,
            authority=f"https://login.microsoftonline.com/{settings.AZURE_TENANT_ID}",
            client_credential=settings.AZURE_CLIENT_SECRET,
        )

        # Get token from auth code
        result = app.acquire_token_by_authorization_code(
            request.code,
            scopes=["https://graph.microsoft.com/User.Read"],
            redirect_uri=settings.AZURE_REDIRECT_URI
        )

        if "error" in result:
            error_msg = result.get('error_description', result.get('error', 'Unknown error'))
            logger.error(f"Azure token exchange failed: {error_msg}")
            logger.error(f"Full Azure error response: {result}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Failed to authenticate with Azure: {error_msg}"
            )

        # Get user info from Microsoft Graph
        graph_response = requests.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {result['access_token']}"}
        )

        if graph_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to retrieve user info from Microsoft Graph"
            )

        graph_data = graph_response.json()

        email = graph_data.get("mail") or graph_data.get("userPrincipalName")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to retrieve email from Azure"
            )

        # Check if user exists, create if not
        user_repo = UserRepository(db)
        user = await user_repo.get_by_email(email)

        if not user:
            # Create user with Azure data using dict approach
            user_data = {
                "email": email,
                "password_hash": get_password_hash(os.urandom(24).hex()),
                "name": f"{graph_data.get('givenName', '')} {graph_data.get('surname', '')}".strip(),
                "is_active": True,
                "preferences": None
            }
            user = await user_repo.create(user_data)

        # Update last login
        await user_repo.update_last_login(user.id)

        # Create tokens
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email, "user_id": user.id, "role": user.role},
            expires_delta=access_token_expires
        )

        refresh_token_expires = timedelta(days=7)
        refresh_token = create_access_token(
            data={"sub": user.email, "user_id": user.id, "role": user.role, "type": "refresh"},
            expires_delta=refresh_token_expires
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Azure login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Azure login failed"
        )


