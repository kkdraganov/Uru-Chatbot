from abc import ABC, abstractmethod
from typing import AsyncIterator, Dict, Any, Optional

class ModelAdapter(ABC):
    """Base class for AI model adapters."""
    
    @abstractmethod
    async def generate_stream(
        self, 
        messages: list[Dict[str, str]], 
        model: str, 
        api_key: str,
        **kwargs
    ) -> AsyncIterator[str]:
        """Generate streaming response from the model."""
        pass
    
    @abstractmethod
    async def validate_api_key(self, api_key: str) -> bool:
        """Validate if the provided API key is valid."""
        pass
    
    @abstractmethod
    def get_available_models(self) -> list[str]:
        """Return list of available models for this adapter."""
        pass
