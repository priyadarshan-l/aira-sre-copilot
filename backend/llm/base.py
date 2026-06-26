from abc import ABC, abstractmethod
from typing import Dict


class BaseLLM(ABC):
    @abstractmethod
    def generate(self, prompt: str) -> Dict:
        """
        Takes a prompt string and returns structured JSON output.
        Must be implemented by all LLM backends.
        """
        pass
