"""OpenAI provider."""

from openai import AsyncOpenAI
import json
from typing import Dict, Any
from .base_provider import BaseAIProvider
from config import settings


class OpenAIProvider(BaseAIProvider):
    """OpenAI GPT provider."""
    
    def __init__(self):
        self.api_key = getattr(settings, 'openai_api_key', None)
        if self.api_key:
            self.client = AsyncOpenAI(api_key=self.api_key)
    
    async def generate_text(self, prompt: str, **kwargs) -> str:
        """Generate text using GPT."""
        if not self.is_available:
            raise ValueError("OpenAI API key not configured")
        
        response = await self.client.chat.completions.create(
            model=kwargs.get('model', 'gpt-4-turbo-preview'),
            messages=[{"role": "user", "content": prompt}],
            max_tokens=kwargs.get('max_tokens', 4096)
        )
        return response.choices[0].message.content
    
    async def generate_structured(self, prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Generate structured data."""
        enhanced_prompt = f"{prompt}\n\nRespond with valid JSON matching this schema: {json.dumps(schema)}"
        text = await self.generate_text(enhanced_prompt)
        return json.loads(text)
    
    @property
    def name(self) -> str:
        return "openai"
    
    @property
    def is_available(self) -> bool:
        return bool(self.api_key)
