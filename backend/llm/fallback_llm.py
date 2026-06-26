from backend.llm.base import BaseLLM


class FallbackLLM(BaseLLM):
    """
    Rule-based fallback when no LLM API key is available.
    Returns structured empty responses so agents degrade gracefully.
    """

    def generate(self, prompt: str) -> dict:
        # Return a safe empty dict so the calling agent uses its rule-based path
        return {}

    def is_available(self) -> bool:
        return False
