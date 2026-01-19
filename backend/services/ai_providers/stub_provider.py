"""Stub AI provider for testing."""

import json
from typing import Dict, Any
from .base_provider import BaseAIProvider


class StubProvider(BaseAIProvider):
    """Stub provider that returns mock data."""
    
    async def generate_text(self, prompt: str, **kwargs) -> str:
        """Generate mock text."""
        return "This is a mock response from the stub AI provider. Configure a real AI provider for actual generation."
    
    async def generate_structured(self, prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Generate mock structured data."""
        return {"message": "Mock structured response", "schema": schema}
    
    @property
    def name(self) -> str:
        return "stub"
    
    @property
    def is_available(self) -> bool:
        return True
