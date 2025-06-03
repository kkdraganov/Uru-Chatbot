from openai import AsyncOpenAI
from typing import AsyncIterator, Dict, Any
from .base import ModelAdapter
from app.core.config import settings

class OpenAIAdapter(ModelAdapter):
    """OpenAI implementation of ModelAdapter."""
    
    def __init__(self):
        self.available_models = settings.OPENAI_MODELS
    
    async def generate_stream(
        self, 
        messages: list[Dict[str, str]], 
        model: str, 
        api_key: str,
        **kwargs
    ) -> AsyncIterator[str]:
        """Generate streaming response from OpenAI."""
        client = AsyncOpenAI(api_key=api_key)
        
        try:
            stream = await client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True,
                **kwargs
            )
            
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"Error: {str(e)}"
    
    async def validate_api_key(self, api_key: str) -> bool:
        """Validate if the provided OpenAI API key is valid."""
        client = AsyncOpenAI(api_key=api_key)
        try:
            # Make a minimal API call to validate the key
            await client.models.list()
            return True
        except:
            return False
    
    def get_available_models(self) -> list[str]:
        """Return list of available models for OpenAI."""
        return self.available_models
