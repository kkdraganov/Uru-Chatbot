from openai import AsyncOpenAI
from typing import AsyncIterator, Dict, Any, Tuple, Optional, List
from .base import ModelAdapter
from app.core.config import settings
import time
import logging

logger = logging.getLogger(__name__)

class OpenAIAdapter(ModelAdapter):
    """Enhanced OpenAI implementation of ModelAdapter."""

    def __init__(self):
        self.available_models = settings.OPENAI_MODELS
        self.model_pricing = {
            "gpt-4o": {"input": 0.005, "output": 0.015},
            "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
            "o1": {"input": 0.015, "output": 0.06},
            "o1-mini": {"input": 0.003, "output": 0.012},
            "gpt-4-turbo": {"input": 0.01, "output": 0.03},
            "gpt-4": {"input": 0.03, "output": 0.06},
            "gpt-3.5-turbo": {"input": 0.0015, "output": 0.002},
        }

    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        model: str,
        api_key: str,
        **kwargs
    ) -> AsyncIterator[Tuple[str, Dict[str, Any]]]:
        """Generate streaming response from OpenAI with metadata."""
        client = AsyncOpenAI(api_key=api_key)
        start_time = time.time()
        total_tokens = 0
        completion_tokens = 0

        try:
            stream = await client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True,
                stream_options={"include_usage": True},
                **kwargs
            )

            content_chunks = []
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    content_chunks.append(content)
                    yield content, {"type": "content", "chunk": content}

                # Handle usage information
                if hasattr(chunk, 'usage') and chunk.usage:
                    total_tokens = chunk.usage.total_tokens
                    completion_tokens = chunk.usage.completion_tokens

            # Calculate final metadata
            processing_time = time.time() - start_time
            cost = self.calculate_cost(model, total_tokens, completion_tokens)

            final_metadata = {
                "type": "complete",
                "total_tokens": total_tokens,
                "completion_tokens": completion_tokens,
                "processing_time": processing_time,
                "cost_estimate": cost,
                "model_used": model,
                "full_content": "".join(content_chunks)
            }

            yield "", final_metadata

        except Exception as e:
            error_metadata = {
                "type": "error",
                "error": str(e),
                "processing_time": time.time() - start_time,
                "model_used": model
            }
            yield f"Error: {str(e)}", error_metadata

    async def validate_api_key(self, api_key: str) -> Dict[str, Any]:
        """Enhanced API key validation with detailed information."""
        client = AsyncOpenAI(api_key=api_key)
        try:
            # Get models and organization info
            models_response = await client.models.list()

            # Filter for chat models
            available_models = [
                model.id for model in models_response.data
                if any(supported in model.id for supported in self.available_models)
            ]

            return {
                "valid": True,
                "models": available_models,
                "organization": getattr(models_response, 'organization', None),
                "error": None
            }
        except Exception as e:
            logger.error(f"API key validation failed: {str(e)}")
            return {
                "valid": False,
                "models": None,
                "organization": None,
                "error": str(e)
            }

    def calculate_cost(self, model: str, total_tokens: int, completion_tokens: int) -> float:
        """Calculate cost estimate for the API call."""
        if model not in self.model_pricing:
            return 0.0

        pricing = self.model_pricing[model]
        input_tokens = total_tokens - completion_tokens

        input_cost = (input_tokens / 1000) * pricing["input"]
        output_cost = (completion_tokens / 1000) * pricing["output"]

        return input_cost + output_cost

    def get_available_models(self) -> List[str]:
        """Return list of available models for OpenAI."""
        return self.available_models

    def get_model_info(self, model: str) -> Dict[str, Any]:
        """Get detailed information about a specific model."""
        model_info = {
            "gpt-4o": {
                "name": "GPT-4o",
                "description": "Most advanced multimodal model",
                "context_length": 128000,
                "supports_streaming": True
            },
            "gpt-4o-mini": {
                "name": "GPT-4o Mini",
                "description": "Fast and efficient model for simple tasks",
                "context_length": 128000,
                "supports_streaming": True
            },
            "o1": {
                "name": "o1",
                "description": "Advanced reasoning model",
                "context_length": 200000,
                "supports_streaming": False
            },
            "o1-mini": {
                "name": "o1 Mini",
                "description": "Efficient reasoning model",
                "context_length": 128000,
                "supports_streaming": False
            }
        }

        info = model_info.get(model, {
            "name": model,
            "description": "OpenAI model",
            "context_length": 4096,
            "supports_streaming": True
        })

        if model in self.model_pricing:
            info.update({
                "input_cost_per_token": self.model_pricing[model]["input"] / 1000,
                "output_cost_per_token": self.model_pricing[model]["output"] / 1000
            })

        return info
