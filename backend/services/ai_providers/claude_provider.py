"""Claude AI provider."""

import anthropic
import json
from typing import Dict, Any
from .base_provider import BaseAIProvider
from config import settings


class ClaudeProvider(BaseAIProvider):
    """Anthropic Claude provider."""
    
    def __init__(self):
        self.api_key = getattr(settings, 'claude_api_key', None)
        if self.api_key:
            self.client = anthropic.Anthropic(api_key=self.api_key)
    
    async def generate_text(self, prompt: str, **kwargs) -> str:
        """Generate text using Claude."""
        if not self.is_available:
            raise ValueError("Claude API key not configured")
        
        message = self.client.messages.create(
            model=kwargs.get('model', 'claude-3-opus-20240229'),
            max_tokens=kwargs.get('max_tokens', 4096),
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text
    
    async def generate_structured(self, prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Generate structured data."""
        enhanced_prompt = f"{prompt}\n\nRespond with valid JSON matching this schema: {json.dumps(schema)}"
        text = await self.generate_text(enhanced_prompt)
        return json.loads(text)
    
    @property
    def name(self) -> str:
        return "claude"
    
    @property
    def is_available(self) -> bool:
        return bool(self.api_key)
