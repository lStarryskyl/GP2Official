"""Ollama local AI provider."""

import httpx
import json
from typing import Dict, Any
from .base_provider import BaseAIProvider
from config import settings


class OllamaProvider(BaseAIProvider):
    """Local AI using Ollama."""
    
    def __init__(self):
        self.base_url = getattr(settings, 'ollama_base_url', 'http://localhost:11434')
    
    async def generate_text(self, prompt: str, **kwargs) -> str:
        """Generate text using Ollama."""
        if not self.is_available:
            raise ValueError("Ollama server not available")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": kwargs.get('model', 'llama2'),
                        "prompt": prompt,
                        "stream": False
                    }
                )
                return response.json()['response']
            except Exception as e:
                raise ValueError(f"Ollama generation failed: {e}")
    
    async def generate_structured(self, prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Generate structured data."""
        enhanced_prompt = f"{prompt}\n\nRespond with valid JSON matching this schema: {json.dumps(schema)}"
        text = await self.generate_text(enhanced_prompt)
        return json.loads(text)
    
    @property
    def name(self) -> str:
        return "ollama"
    
    @property
    def is_available(self) -> bool:
        try:
            import httpx
            response = httpx.get(f"{self.base_url}/api/tags", timeout=2.0)
            return response.status_code == 200
        except:
            return False
