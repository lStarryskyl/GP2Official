"""Base AI provider interface."""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class BaseAIProvider(ABC):
    """Base class for AI providers."""
    
    @abstractmethod
    async def generate_text(self, prompt: str, **kwargs) -> str:
        """Generate text from prompt."""
        pass
    
    @abstractmethod
    async def generate_structured(self, prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Generate structured data from prompt."""
        pass
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name."""
        pass
    
    @property
    @abstractmethod
    def is_available(self) -> bool:
        """Check if provider is available."""
        pass
