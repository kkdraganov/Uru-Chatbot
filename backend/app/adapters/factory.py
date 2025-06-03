from typing import Dict, Any, List, Optional
from .openai_adapter import OpenAIAdapter
from .base import ModelAdapter

class AdapterFactory:
    """Factory for creating model adapters."""
    
    _adapters: Dict[str, ModelAdapter] = {
        "openai": OpenAIAdapter()
    }
    
    @classmethod
    def get_adapter(cls, provider: str = "openai") -> Optional[ModelAdapter]:
        """Get adapter by provider name."""
        return cls._adapters.get(provider)
    
    @classmethod
    def register_adapter(cls, provider: str, adapter: ModelAdapter) -> None:
        """Register a new adapter."""
        cls._adapters[provider] = adapter
    
    @classmethod
    def get_available_providers(cls) -> List[str]:
        """Get list of available providers."""
        return list(cls._adapters.keys())
