from abc import ABC, abstractmethod
from typing import AsyncIterator, Dict, Any, Optional, Tuple, List

class ModelAdapter(ABC):
    """Enhanced base class for AI model adapters."""

    @abstractmethod
    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        ai_model: str,
        api_key: str,
        **kwargs
    ) -> AsyncIterator[Tuple[str, Dict[str, Any]]]:
        """Generate streaming response from the model with metadata."""
        pass

    @abstractmethod
    async def validate_api_key(self, api_key: str) -> Dict[str, Any]:
        """Validate API key and return detailed information."""
        pass

    @abstractmethod
    def get_available_models(self) -> List[str]:
        """Return list of available models for this adapter."""
        pass

    @abstractmethod
    def calculate_cost(self, ai_model: str, total_tokens: int, completion_tokens: int) -> float:
        """Calculate cost estimate for the API call."""
        pass

    @abstractmethod
    def get_model_info(self, ai_model: str) -> Dict[str, Any]:
        """Get detailed information about a specific model."""
        pass
