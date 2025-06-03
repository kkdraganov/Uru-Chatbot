from fastapi import Request
from typing import AsyncIterator, Optional
import asyncio
import json

class SSEResponse:
    """Server-Sent Events response handler."""
    
    def __init__(
        self, 
        content_iterator: AsyncIterator[str],
        event_type: str = "message"
    ):
        self.content_iterator = content_iterator
        self.event_type = event_type
    
    async def __call__(self, request: Request):
        """Generate SSE response."""
        async def event_generator():
            try:
                # Send initial connection established message
                yield f"event: {self.event_type}\ndata: Connection established\n\n"
                
                # Stream content from iterator
                async for content in self.content_iterator:
                    if await request.is_disconnected():
                        break
                    
                    # Format as SSE event
                    # Escape newlines in content to ensure proper SSE format
                    escaped_content = json.dumps({"content": content})
                    yield f"event: {self.event_type}\ndata: {escaped_content}\n\n"
                
                # Send completion message
                yield f"event: complete\ndata: Stream completed\n\n"
            except Exception as e:
                # Send error message
                error_data = json.dumps({"error": str(e)})
                yield f"event: error\ndata: {error_data}\n\n"
        
        return event_generator()

class StreamingManager:
    """Manager for streaming connections."""
    
    def __init__(self):
        self.active_connections = {}
    
    async def register_connection(self, connection_id: str, request: Request) -> None:
        """Register a new streaming connection."""
        self.active_connections[connection_id] = request
    
    async def remove_connection(self, connection_id: str) -> None:
        """Remove a streaming connection."""
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
    
    async def is_connected(self, connection_id: str) -> bool:
        """Check if a connection is still active."""
        if connection_id not in self.active_connections:
            return False
        
        request = self.active_connections[connection_id]
        return not await request.is_disconnected()
    
    def get_active_connections_count(self) -> int:
        """Get count of active connections."""
        return len(self.active_connections)
